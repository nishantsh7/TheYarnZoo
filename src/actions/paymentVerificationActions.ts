
'use server';

import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import type { Order, OrderItem, Product } from '@/types';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_SECRET) {
  console.error("RAZORPAY_KEY_SECRET is not configured in environment variables.");
}

const VerifyPaymentInputSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  ourOrderId: z.string(), 
});

export type VerifyPaymentActionResponse = {
  success: boolean;
  message: string;
  ourOrderId?: string;
  isVerified?: boolean;
};

async function decrementProductStock(items: OrderItem[]): Promise<void> {
  const { db } = await connectToDatabase();
  const productsCollection = db.collection<Product>('products');

  for (const item of items) {
    if (!ObjectId.isValid(item.productId)) {
      console.warn(`Invalid productId for stock decrement: ${item.productId}`);
      continue; 
    }
    try {
      const productObjectId = new ObjectId(item.productId);
      const updateResult = await productsCollection.updateOne(
        { _id: productObjectId },
        { $inc: { stock: -item.quantity } }
      );

      if (updateResult.matchedCount === 0) {
        console.warn(`Product with _id ${item.productId} not found for stock decrement.`);
      }
      if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
        console.warn(`Stock for product _id ${item.productId} was not decremented (maybe already updated or stock check failed internally?).`);
      }
    } catch (error) {
      console.error(`Error decrementing stock for product _id ${item.productId}:`, error);
      // Decide if this should throw or just log. For now, logging.
    }
  }
}

export async function verifyRazorpayPaymentAction(
  input: z.infer<typeof VerifyPaymentInputSchema>
): Promise<VerifyPaymentActionResponse> {
  const validatedFields = VerifyPaymentInputSchema.safeParse(input);
  if (!validatedFields.success) {
    return { success: false, message: "Invalid payment verification input: " + validatedFields.error.flatten().fieldErrors };
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, ourOrderId } = validatedFields.data;

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return { success: false, message: "Payment verification failed: Invalid signature.", ourOrderId, isVerified: false };
    }

    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<Order>('orders');

    // Fetch the order to get items for stock decrement
    const order = await ordersCollection.findOne({ id: ourOrderId, razorpayOrderId: razorpay_order_id });
    if (!order) {
        console.error(`Order not found for ourOrderId: ${ourOrderId} and razorpayOrderId: ${razorpay_order_id} when trying to fetch for stock decrement.`);
        return { success: false, message: "Order details not found for stock update. Payment verified, but please contact support.", ourOrderId, isVerified: true };
    }
    
    const updateResult = await ordersCollection.updateOne(
      { id: ourOrderId, razorpayOrderId: razorpay_order_id },
      {
        $set: {
          paymentStatus: 'paid',
          orderStatus: 'processing',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      console.error(`Order not found for ourOrderId: ${ourOrderId} and razorpayOrderId: ${razorpay_order_id} during payment update.`);
      return { success: false, message: "Payment verified, but order update failed in our system. Please contact support.", ourOrderId, isVerified: true };
    }
    if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
      // Order was already updated. Still attempt stock decrement if items are available.
      await decrementProductStock(order.items);
      return { success: true, message: "Payment already confirmed. Stock updated (if applicable).", ourOrderId, isVerified: true };
    }

    // If update was successful (modifiedCount > 0)
    await decrementProductStock(order.items);

    return { success: true, message: "Payment verified, order updated, and stock decremented.", ourOrderId, isVerified: true };

  } catch (error) {
    console.error("verifyRazorpayPaymentAction Error:", error);
    let message = "An unexpected error occurred during payment verification.";
    if (error instanceof Error) {
        message = `Payment verification error: ${error.message}`;
    }
    return { success: false, message, ourOrderId, isVerified: false };
  }
}
