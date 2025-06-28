
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserDocument, UserRole } from '@/types';

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."), // Min 1, as actual length check is less important here
});

export type AuthActionResponse = {
  success: boolean;
  message: string;
  user?: { id: string; name: string; email: string; role: UserRole }; // Exclude passwordHash, include role
};

export async function registerUserAction(values: unknown): Promise<AuthActionResponse> {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Invalid input: " + validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<UserDocument>('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return { success: false, message: "User with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Determine role: first user is admin, others are 'user'
    const usersCount = await usersCollection.countDocuments();
    const role: UserRole = usersCount === 0 ? 'admin' : 'user';

    const newUser: Omit<UserDocument, '_id' | 'id'> = {
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    if (!result.insertedId) {
      return { success: false, message: "Failed to create user. Please try again." };
    }
    
    return { 
      success: true, 
      message: `Registration successful! You have been assigned the role: ${role}. Please login.`,
      user: { id: result.insertedId.toString(), name, email, role } 
    };

  } catch (error) {
    console.error("Registration error (authActions.ts):", error); // Detailed server log
    let message = "An unexpected error occurred during registration. Please check server logs for more details.";
    if (error instanceof Error) {
        if (error.message.includes("MONGODB_URI environment variable") || error.message.includes("MONGODB_URI is not defined")) {
            message = "Database configuration error: MONGODB_URI is missing or invalid. Please check server environment variables and server logs.";
        } else if (error.message.includes("MONGODB_DB environment variable") || error.message.includes("MONGODB_DB is not defined")) {
            message = "Database configuration error: MONGODB_DB is missing or invalid. Please check server environment variables and server logs.";
        } else if (error.message.toLowerCase().includes("failed to connect") || error.message.toLowerCase().includes("authentication failed") || error.message.toLowerCase().includes("timeout") || error.message.includes("SSL alert number 80")) {
            message = "Database connection failed. Please check your connection string, ensure the database server is running, accessible, and IP addresses are whitelisted if using a cloud service like Atlas. Also, check server logs.";
        } else {
            message = `Registration failed: ${error.message}. Check server logs for details.`;
        }
    }
    return { success: false, message };
  }
}


export async function loginUserAction(values: unknown): Promise<AuthActionResponse> {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Invalid input: " + validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<UserDocument>('users');

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, message: "Invalid email or password." };
    }

    // Important: Do NOT send passwordHash to the client
    return { 
      success: true, 
      message: "Login successful!",
      user: { id: user._id!.toString(), name: user.name, email: user.email, role: user.role }
    };

  } catch (error) {
    console.error("Login error (authActions.ts):", error); // Detailed server log
    let message = "An unexpected error occurred during login. Please check server logs for more details.";
     if (error instanceof Error) {
        if (error.message.includes("MONGODB_URI environment variable") || error.message.includes("MONGODB_URI is not defined")) {
            message = "Database configuration error: MONGODB_URI is missing or invalid. Please check server environment variables and server logs.";
        } else if (error.message.includes("MONGODB_DB environment variable") || error.message.includes("MONGODB_DB is not defined")) {
            message = "Database configuration error: MONGODB_DB is missing or invalid. Please check server environment variables and server logs.";
        } else if (error.message.toLowerCase().includes("failed to connect") || error.message.toLowerCase().includes("authentication failed") || error.message.toLowerCase().includes("timeout") || error.message.includes("SSL alert number 80")) {
            message = "Database connection failed. Please check your connection string and ensure the database server is running, accessible, and IP addresses are whitelisted if using a cloud service like Atlas. Also, check server logs.";
        } else {
            message = `Login failed: ${error.message}. Check server logs for details.`;
        }
    }
    return { success: false, message };
  }
}

