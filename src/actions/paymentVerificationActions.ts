
'use server';

import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import type { Order, Product } from '@/types';
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

    // --- ** Atomic Stock Check & Decrement ** ---
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<Order>('orders');
    const productsCollection = db.collection<Product>('products');

    const order = await ordersCollection.findOne({ id: ourOrderId, razorpayOrderId: razorpay_order_id });
    if (!order) {
        return { success: false, message: "Order details not found. Payment verified, but please contact support.", ourOrderId, isVerified: true };
    }
    
    // If order is not pending, it might have been processed already.
    if (order.orderStatus !== 'pending') {
        return { success: true, message: "Payment already confirmed.", ourOrderId, isVerified: true };
    }

    const successfullyDecremented: { productId: string; quantity: number }[] = [];

    for (const item of order.items) {
      const productObjectId = new ObjectId(item.productId);
      const updateResult = await productsCollection.updateOne(
        { _id: productObjectId, stock: { $gte: item.quantity } } as any,
        { $inc: { stock: -item.quantity } }
      );

      if (updateResult.modifiedCount === 0) {
        // Failed to secure stock for this item. Revert previous decrements.
        for (const revertedItem of successfullyDecremented) {
          await productsCollection.updateOne(
            { _id: new ObjectId(revertedItem.productId) } as any,
            { $inc: { stock: revertedItem.quantity } }
          );
        }
        // Mark order as cancelled due to stock issue.
        await ordersCollection.updateOne(
          { id: ourOrderId },
          { $set: { 
              orderStatus: 'cancelled', 
              paymentStatus: 'failed', // Or a custom status like 'refund_required'
              updatedAt: new Date(),
              razorpayPaymentId: razorpay_payment_id,
            } }
        );
        return { success: false, message: `Sorry, ${item.name} went out of stock just as you were checking out. The order has been cancelled and will be refunded.`, ourOrderId, isVerified: true };
      }
      successfullyDecremented.push({ productId: item.productId, quantity: item.quantity });
    }

    // If we reach here, all stock was successfully decremented.
    const finalUpdateResult = await ordersCollection.updateOne(
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

    if (finalUpdateResult.modifiedCount === 0) {
      // This is a safeguard, should be unlikely if the status check at the top works.
      return { success: false, message: "Order update failed after stock decrement. Please contact support immediately.", ourOrderId, isVerified: true };
    }
    
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
