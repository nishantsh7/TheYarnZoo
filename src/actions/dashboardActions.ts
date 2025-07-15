
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { Order, Product, UserDocument, DashboardStats } from '@/types';

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<Order>('orders');
    const productsCollection = db.collection<Product>('products');
    const usersCollection = db.collection<UserDocument>('users');

    const totalRevenueResult = await ordersCollection.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).toArray();
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const totalOrders = await ordersCollection.countDocuments();
    const totalProducts = await productsCollection.countDocuments();
    const totalCustomers = await usersCollection.countDocuments({ role: 'user' }); // Assuming 'user' role for customers
    
    const pendingOrders = await ordersCollection.countDocuments({ 
      orderStatus: { $in: ['pending', 'processing'] } 
    });
    
    const lowStockItems = await productsCollection.countDocuments({ 
      stock: { $lt: 10, $gt: 0 } // Example: stock less than 10 but greater than 0
    });

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      lowStockItems,
    };

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return default/zero stats in case of error
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      pendingOrders: 0,
      lowStockItems: 0,
    };
  }
}
