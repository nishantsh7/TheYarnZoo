
'use server';

import { z } from 'zod';
import Razorpay from 'razorpay';
import { connectToDatabase } from '@/lib/mongodb';
import type { Order, OrderItem, ShippingAddress, CartItem } from '@/types'; // Updated OrderItem
import { ObjectId } from 'mongodb';

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
  cartItems: z.array(z.object({ // cartItems from client
    productId: z.string(), // Should be MongoDB _id string
    name: z.string(),
    price: z.number(),
    image: z.string().url(),
    quantity: z.number().min(1),
    stock: z.number(), // Current stock for reference, not used for final order item
  })).min(1, "Cart cannot be empty"),
  userId: z.string().optional(),
});

export type CreatePaymentOrderActionResponse = {
  success: boolean;
  message: string;
  ourOrderId?: string;
  razorpayOrderId?: string;
  amountInPaisa?: number;
  razorpayKeyId?: string;
};

export async function createPaymentOrderAction(
  input: z.infer<typeof CreateOrderInputSchema>
): Promise<CreatePaymentOrderActionResponse> {
  const validatedFields = CreateOrderInputSchema.safeParse(input);
  if (!validatedFields.success) {
    return { success: false, message: "Invalid order input: " + validatedFields.error.flatten().fieldErrors };
  }

  const { shippingDetails, cartItems, userId } = validatedFields.data;

  const totalAmountInRupees = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = 50; 
  const finalAmountInRupees = totalAmountInRupees + shippingCost;
  const amountInPaisa = Math.round(finalAmountInRupees * 100);

  try {
    const { db } = await connectToDatabase();
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

    // Transform CartItem[] to OrderItem[] for storage
    const orderItemsToStore: OrderItem[] = cartItems.map(ci => ({
        productId: ci.productId, // This is the MongoDB _id string
        name: ci.name,
        price: ci.price, // Price at time of order
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

// New function to get orders for admin panel
export async function getAdminOrders(): Promise<Order[]> {
  try {
    const { db } = await connectToDatabase();
    const orderDocs = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
    
    // Map MongoDB document to Order type
    return orderDocs.map(doc => ({
      ...doc,
      _id: doc._id.toString(), // Convert ObjectId to string for client-side _id if needed by type
      // id is already the user-friendly string
      createdAt: doc.createdAt, // Already a Date from DB
      updatedAt: doc.updatedAt, // Already a Date from DB
      items: doc.items.map((item: any) => ({ // Ensure items are mapped correctly
          productId: item.productId.toString(), // Assuming productId in DB is ObjectId for products
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
      }))
    })) as unknown as Order[]; // Cast needed due to ObjectId string conversion nuances
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return [];
  }
}

// Helper to get a single order, e.g. for order detail page.
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { db } = await connectToDatabase();
    // Assuming orderId is the custom string ID `TYZ-xxxx`
    const orderDoc = await db.collection('orders').findOne({ id: orderId });
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
