'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { Order } from '@/types';

export type MonthlySalesData = {
  month: string;
  total: number;
};

export async function getMonthlySalesData(): Promise<MonthlySalesData[]> {
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<Order>('orders');

    const salesData = await ordersCollection.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $limit: 12 // Get the last 12 months of data
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                monthsInYear: ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              },
              in: { $arrayElemAt: ["$$monthsInYear", "$_id.month"] }
            }
          },
          total: "$total"
        }
      }
    ]).toArray();

    // The aggregation result is already in the correct shape, but we cast it for type safety
    return salesData as MonthlySalesData[];

  } catch (error) {
    console.error("Error fetching monthly sales data:", error);
    return [];
  }
}
