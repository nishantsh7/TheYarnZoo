
'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import type { NewsletterSubscription } from '@/types';
import { revalidatePath } from 'next/cache';

const SubscribeSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export type NewsletterActionResponse = {
  success: boolean;
  message: string;
};

export async function subscribeToNewsletterAction(
  prevState: NewsletterActionResponse, 
  formData: FormData
): Promise<NewsletterActionResponse> {
  const email = formData.get('email');
  
  const validatedFields = SubscribeSchema.safeParse({ email });

  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.email?.[0] || "Invalid email format." };
  }
  
  const validEmail = validatedFields.data.email;

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<NewsletterSubscription>('newsletterSubscriptions');

    const existingSubscription = await collection.findOne({ email: validEmail });

    if (existingSubscription) {
      return { success: true, message: "You are already subscribed to our newsletter!" };
    }

    const newSubscription: Omit<NewsletterSubscription, '_id'> = {
      email: validEmail,
      subscribedAt: new Date(),
    };

    await collection.insertOne(newSubscription);
    
    revalidatePath('/'); // Revalidate home page if needed in the future

    return { success: true, message: "Thank you for subscribing! Welcome to the herd." };

  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return { success: false, message: "An unexpected error occurred. Please try again later." };
  }
}
