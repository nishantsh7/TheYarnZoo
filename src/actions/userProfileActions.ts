
'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserDocument, ShippingAddress, AdminCustomerInfo, UserRole } from '@/types';
import { ObjectId } from 'mongodb';

const ShippingAddressActionSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  address: z.string().min(5, "Street address is required."),
  city: z.string().min(2, "City is required."),
  postalCode: z.string().min(3, "Postal code is required."),
  country: z.string().min(2, "Country is required."),
  phone: z.string().min(7, "Valid phone number is required."),
});

export type UserProfileActionResponse = {
  success: boolean;
  message: string;
  shippingAddress?: ShippingAddress | null;
};

export async function saveUserShippingAddressAction(
  userId: string,
  shippingAddressData: unknown
): Promise<Omit<UserProfileActionResponse, 'shippingAddress'>> {
  if (!ObjectId.isValid(userId)) {
    return { success: false, message: "Invalid user ID format." };
  }

  const validatedFields = ShippingAddressActionSchema.safeParse(shippingAddressData);
  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(errors).flat().join(', ');
    return { success: false, message: "Invalid shipping address data: " + errorMessages };
  }

  const validShippingAddress = validatedFields.data;
  const userObjectId = new ObjectId(userId);

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<UserDocument>('users');

    const result = await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { shippingAddress: validShippingAddress } }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: "User not found. Could not save shipping address." };
    }
    if (result.modifiedCount === 0 && result.matchedCount > 0) {
      return { success: true, message: "Shipping address is already up to date." };
    }

    return { success: true, message: "Shipping address saved successfully." };
  } catch (error) {
    console.error("saveUserShippingAddressAction Error:", error);
    return { success: false, message: `Error saving shipping address: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function getUserShippingAddressAction(userId: string): Promise<ShippingAddress | null> {
  if (!ObjectId.isValid(userId)) {
    console.error("getUserShippingAddressAction: Invalid user ID format.");
    return null;
  }
  const userObjectId = new ObjectId(userId);

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<UserDocument>('users');

    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      console.log(`getUserShippingAddressAction: User not found with ID ${userId}.`);
      return null;
    }

    return user.shippingAddress || null;
  } catch (error) {
    console.error("getUserShippingAddressAction Error:", error);
    return null;
  }
}

// New function to get users for admin customers page
export async function getAdminUsers(): Promise<AdminCustomerInfo[]> {
  try {
    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserDocument>('users');
    // Fetching all users for now. Could filter by role: 'user' if strictly customers.
    const users = await userCollection.find({}).sort({ createdAt: -1 }).toArray();

    return users.map(user => ({
      _id: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      // totalOrders: 0, // Placeholder, requires aggregation
      // totalSpent: 0, // Placeholder, requires aggregation
      // lastOrderDate: '', // Placeholder
    }));
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}
