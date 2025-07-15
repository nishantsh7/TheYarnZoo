
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserDocument, ShippingAddress, AdminCustomerInfo, UserRole } from '@/types';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

const ShippingAddressActionSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  address: z.string().min(5, "Street address is required."),
  city: z.string().min(2, "City is required."),
  postalCode: z.string().min(3, "Postal code is required."),
  country: z.string().min(2, "Country is required."),
  phone: z.string().min(7, "Valid phone number is required."),
});

const UpdateNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

const UpdateUserRoleSchema = z.object({
  userId: z.string().refine((val) => ObjectId.isValid(val), "Invalid user ID."),
  newRole: z.enum(['admin', 'user']),
});


export type ProfileActionResponse = {
  success: boolean;
  message: string;
};

export async function saveUserShippingAddressAction(
  userId: string,
  shippingAddressData: unknown
): Promise<ProfileActionResponse> {
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

export async function updateUserProfileName(userId: string, data: unknown): Promise<ProfileActionResponse> {
    if (!ObjectId.isValid(userId)) {
        return { success: false, message: "Invalid user ID." };
    }

    const validatedFields = UpdateNameSchema.safeParse(data);
    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.flatten().fieldErrors.name?.[0] || "Invalid name." };
    }

    const { name } = validatedFields.data;

    try {
        const { db } = await connectToDatabase();
        const usersCollection = db.collection<UserDocument>('users');
        const result = await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { name } });

        if (result.matchedCount === 0) {
            return { success: false, message: "User not found." };
        }
        if (result.modifiedCount === 0) {
            return { success: true, message: "Name is already up to date." };
        }

        return { success: true, message: "Your name has been updated successfully." };
    } catch (error) {
        console.error("updateUserProfileName Error:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}

export async function updateUserPassword(userId: string, data: unknown): Promise<ProfileActionResponse> {
    if (!ObjectId.isValid(userId)) {
        return { success: false, message: "Invalid user ID." };
    }

    const validatedFields = UpdatePasswordSchema.safeParse(data);
    if (!validatedFields.success) {
        return { success: false, message: JSON.stringify(validatedFields.error.flatten().fieldErrors) };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    try {
        const { db } = await connectToDatabase();
        const usersCollection = db.collection<UserDocument>('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return { success: false, message: "User not found." };
        }

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordCorrect) {
            return { success: false, message: "Incorrect current password." };
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { passwordHash: newPasswordHash } });

        return { success: true, message: "Password updated successfully. Please log in again." };
    } catch (error) {
        console.error("updateUserPassword Error:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}

export async function updateUserRoleAction(data: unknown): Promise<ProfileActionResponse> {
  const validatedFields = UpdateUserRoleSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Invalid input: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
  }

  const { userId, newRole } = validatedFields.data;

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<UserDocument>('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: newRole } }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: "User not found." };
    }

    revalidatePath('/admin/customers');

    return { success: true, message: "User role updated successfully." };
  } catch (error) {
    console.error("updateUserRoleAction Error:", error);
    return { success: false, message: "An unexpected error occurred while updating the role." };
  }
}
