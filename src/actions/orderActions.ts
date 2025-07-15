
'use server';

import { z } from 'zod';
import Razorpay from 'razorpay';
import { connectToDatabase } from '@/lib/mongodb';
import type { Order, OrderItem, Product } from '@/types';
import { ObjectId, Filter } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { sendOrderStatusUpdateEmail } from '@/lib/email-service';

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Razorpay API keys are not configured in environment variables.");
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID!,
  key_secret: RAZORPAY_KEY_SECRET!,
});

const CreateOrderInputSchema = z.object({
  shippingDetails: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(1, "Phone is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  cartItems: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number(),
    image: z.string().url(),
    quantity: z.number().min(1),
    stock: z.number(), // This is the stock at the time of adding to cart, used for reference
  })).min(1, "Cart cannot be empty"),
  userId: z.string().optional(),
});

const UpdateOrderStatusSchema = z.object({
    orderId: z.string().refine(val => ObjectId.isValid(val), "Invalid Order ID"),
    newStatus: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
    trackingNumber: z.string().optional(),
});

export type CreatePaymentOrderActionResponse = {
  success: boolean;
  message: string;
  ourOrderId?: string;
  razorpayOrderId?: string;
  amountInPaisa?: number;
  razorpayKeyId?: string;
};

export type UpdateOrderStatusActionResponse = {
    success: boolean;
    message: string;
};


export async function createPaymentOrderAction(
  input: z.infer<typeof CreateOrderInputSchema>
): Promise<CreatePaymentOrderActionResponse> {
  const validatedFields = CreateOrderInputSchema.safeParse(input);
  if (!validatedFields.success) {
    return { success: false, message: "Invalid order input: " + validatedFields.error.flatten().fieldErrors };
  }

  const { shippingDetails, cartItems, userId } = validatedFields.data;

  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');

    // ** Preliminary Stock Check **
    for (const item of cartItems) {
      if (!ObjectId.isValid(item.productId)) {
        return { success: false, message: `Invalid product ID for ${item.name}.` };
      }
      const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) } as any);
      if (!product || product.stock < item.quantity) {
        return { success: false, message: `Sorry, ${item.name} is out of stock or has insufficient quantity. Please update your cart.` };
      }
    }


    const totalAmountInRupees = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = 50; 
    const finalAmountInRupees = totalAmountInRupees + shippingCost;
    const amountInPaisa = Math.round(finalAmountInRupees * 100);

    const ordersCollection = db.collection<Omit<Order, '_id'>>('orders');
    
    const internalOrderId = `TYZ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const razorpayOrderOptions = {
      amount: amountInPaisa,
      currency: "INR",
      receipt: internalOrderId,
      payment_capture: 1, 
    };
    
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error("Razorpay order creation failed or returned invalid response.");
      }
    } catch (razorpayError) {
      console.error("Razorpay order creation error:", razorpayError);
      return { success: false, message: `Failed to create Razorpay order: ${razorpayError instanceof Error ? razorpayError.message : 'Unknown Razorpay error'}` };
    }

    const orderItemsToStore: OrderItem[] = cartItems.map(ci => ({
        productId: ci.productId,
        name: ci.name,
        price: ci.price,
        image: ci.image,
        quantity: ci.quantity,
    }));

    const newOrderDocument: Omit<Order, '_id'> = {
      id: internalOrderId,
      userId: userId,
      userEmail: shippingDetails.email,
      items: orderItemsToStore,
      totalAmount: finalAmountInRupees,
      shippingAddress: shippingDetails,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      razorpayOrderId: razorpayOrder.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ordersCollection.insertOne(newOrderDocument);
    if (!result.insertedId) {
      console.error("Failed to insert order into database after Razorpay order creation.");
      // Note: At this point, a Razorpay order exists but our DB failed. This is rare but needs manual reconciliation.
      return { success: false, message: "Database error: Could not save order. Please contact support." };
    }

    return {
      success: true,
      message: "Order initiated successfully.",
      ourOrderId: internalOrderId,
      razorpayOrderId: razorpayOrder.id,
      amountInPaisa: amountInPaisa,
      razorpayKeyId: RAZORPAY_KEY_ID!,
    };

  } catch (error) {
    console.error("createPaymentOrderAction Error:", error);
    let message = "An unexpected error occurred while initiating the order.";
    if (error instanceof Error) {
        message = `Order initiation failed: ${error.message}`;
    }
    return { success: false, message };
  }
}

export async function getAdminOrders(): Promise<Order[]> {
  try {
    const { db } = await connectToDatabase();
    // Note: Not strongly typing the collection here avoids the error, which is a valid strategy.
    const orderDocs = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
    
    return orderDocs.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      items: doc.items.map((item: any) => ({
          productId: item.productId.toString(),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
      }))
    })) as unknown as Order[];
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return [];
  }
}

export async function getOrdersByUserId(userId: string, limit?: number): Promise<Order[]> {
  if (!ObjectId.isValid(userId)) {
    console.error("Invalid user ID for getOrdersByUserId:", userId);
    return [];
  }
  try {
    const { db } = await connectToDatabase();
    const query = { userId: userId };
    let cursor = db.collection('orders').find(query).sort({ createdAt: -1 });

    if (limit) {
      cursor = cursor.limit(limit);
    }
    
    const orderDocs = await cursor.toArray();
    
    return orderDocs.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      items: doc.items.map((item: any) => ({
          productId: item.productId.toString(),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
      }))
    })) as unknown as Order[];
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    return [];
  }
}


export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { db } = await connectToDatabase();
    const isObjectId = ObjectId.isValid(orderId);
    
    let query: Filter<any>;
    if (isObjectId) {
        query = { _id: new ObjectId(orderId) };
    } else if (orderId.startsWith('TYZ-')) {
        query = { id: orderId };
    } else {
        console.error(`Invalid orderId format: ${orderId}`);
        return null;
    }

    const orderDoc = await db.collection('orders').findOne(query);
    if (!orderDoc) return null;

    return {
      ...orderDoc,
      _id: orderDoc._id.toString(),
      items: orderDoc.items.map((item: any) => ({
          productId: item.productId.toString(),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
      }))
    } as unknown as Order;
  } catch (error) {
    console.error(`Error fetching order by id ${orderId}:`, error);
    return null;
  }
}

export async function updateOrderStatusAction(
  data: z.infer<typeof UpdateOrderStatusSchema>
): Promise<UpdateOrderStatusActionResponse> {
    const validatedFields = UpdateOrderStatusSchema.safeParse(data);
    if (!validatedFields.success) {
        return { success: false, message: "Invalid input: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
    }

    const { orderId, newStatus, trackingNumber } = validatedFields.data;
    const orderObjectId = new ObjectId(orderId);

    try {
        const { db } = await connectToDatabase();
        const ordersCollection = db.collection<Order>('orders');
        
        // FIX: Cast the filter to `any` to resolve the TypeScript error.
        // This tells TypeScript to trust that the query is valid for the MongoDB driver,
        // even though the `ObjectId` type doesn't match the `string` type of `Order._id`.
        const filter = { _id: orderObjectId };
        
        const currentOrder = await ordersCollection.findOne(filter as any);
        if (!currentOrder) {
            return { success: false, message: "Order not found." };
        }

        const updateData: any = {
            orderStatus: newStatus,
            updatedAt: new Date(),
        };

        if (newStatus === 'shipped' && trackingNumber) {
            updateData.trackingNumber = trackingNumber;
        }

        // FIX: Apply the same `as any` cast to the filter in the update operation.
        const result = await ordersCollection.updateOne(
            filter as any,
            { $set: updateData }
        );

        if (result.modifiedCount === 0) {
            return { success: false, message: "Failed to update order status or status was already set." };
        }
        
        // Send email notification to the customer
        await sendOrderStatusUpdateEmail({
            customerEmail: currentOrder.shippingAddress.email || currentOrder.userEmail!,
            customerName: currentOrder.shippingAddress.name,
            orderId: currentOrder.id, // Use the internal, user-friendly ID
            newStatus: newStatus,
            trackingNumber: trackingNumber,
        });

        // Revalidate paths to reflect the changes in the UI immediately
        revalidatePath('/admin/orders');
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath(`/orders/${currentOrder.id}`);

        return { success: true, message: `Order status successfully updated to ${newStatus}.` };

    } catch (error) {
        console.error("updateOrderStatusAction Error:", error);
        return { success: false, message: "An unexpected error occurred during status update." };
    }
}
