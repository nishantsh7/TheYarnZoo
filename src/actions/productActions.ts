'use server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import type { Product, Review } from '@/types'; // Your existing types file
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb'; // Important for creating ObjectId instances

// Define a type for products when interacting directly with the database
// This tells TypeScript that _id on the actual DB document is an ObjectId
type ProductDb = Omit<Product, '_id'> & { _id?: ObjectId };

// ... (Your existing schemas and response types) ...

const internalProductFormSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0.01, "Price must be a positive value."),
  category: z.string().min(2, "Category is required."),
  material: z.string().min(2, "Material is required."),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer."),
  images: z.array(z.string().url("Must be a valid URL.")).min(1, "At least one image is required."),
});

const reviewFormSchema = z.object({
  productId: z.string().refine(val => ObjectId.isValid(val), "Invalid Product ID"),
  userId: z.string().refine(val => ObjectId.isValid(val), "Invalid User ID"),
  userName: z.string().min(2, "User name is required."),
  rating: z.coerce.number().min(1).max(5),
  text: z.string().min(10, "Review must be at least 10 characters.").max(500),
});

export type ProductFormData = z.infer<typeof internalProductFormSchema>;

export type ProductActionResponse = {
  success: boolean;
  message: string;
  productId?: string;
  slug?: string;
};

export type ReviewActionResponse = {
  success: boolean;
  message: string;
};

// CREATE
export async function createProductAction(data: ProductFormData): Promise<ProductActionResponse> {
  const validatedFields = internalProductFormSchema.safeParse(data);
  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(errors).flat().join(', ');
    return { success: false, message: "Invalid product data: " + errorMessages };
  }

  const { _id, ...productData } = validatedFields.data;

  try {
    const { db } = await connectToDatabase();
    // Use ProductDb here for the collection
    const existingProductBySlug = await db.collection<ProductDb>('products').findOne({ slug: productData.slug });
    if (existingProductBySlug) {
      return { success: false, message: `Product with slug "${productData.slug}" already exists.` };
    }

    // Ensure the document matches what the DB expects for initial insert (no _id)
    const newProductDocument: Omit<Product, 'id' | '_id'> & { reviews: Review[]; averageRating: number; createdAt: Date; updatedAt: Date; } = {
        ...productData,
        reviews: [],
        averageRating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };


    const result = await db.collection<ProductDb>('products').insertOne(newProductDocument as ProductDb); // Cast for insert
    if (!result.insertedId) {
      return { success: false, message: "Failed to create product in database." };
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath(`/products/${productData.slug}`);

    return { success: true, message: "Product created successfully!", productId: result.insertedId.toString(), slug: productData.slug };
  } catch (error) {
    console.error("createProductAction Error:", error);
    return { success: false, message: `Error creating product: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// READ (for admin list)
export async function getAdminProducts(): Promise<Product[]> {
  try {
    const { db } = await connectToDatabase();
    const productDocs = await db.collection<ProductDb>('products').find({}).sort({ createdAt: -1 }).toArray();

    // Mapping to ensure _id is a string as per your original Product interface for consistency
    return productDocs.map(p => ({
      ...p,
      _id: p._id ? p._id.toString() : undefined, // Convert ObjectId to string for the Product type
      id: p.slug,
      reviews: p.reviews || [],
      averageRating: p.averageRating || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })) as Product[]; // Assert back to Product[] for the return type
  } catch (error) {
    console.error("getAdminProducts Error:", error);
    return [];
  }
}

// READ (single product for editing, by slug)
export async function getProductBySlugForEditing(slug: string): Promise<Product | null> {
  try {
    const { db } = await connectToDatabase();
    const productDoc = await db.collection<ProductDb>('products').findOne({ slug });
    if (!productDoc) return null;

    // Mapping to ensure _id is a string as per your original Product interface for consistency
    return {
      ...productDoc,
      _id: productDoc._id ? productDoc._id.toString() : undefined, // Convert ObjectId to string
      id: productDoc.slug,
      reviews: productDoc.reviews || [],
      averageRating: productDoc.averageRating || 0,
    } as Product; // Assert back to Product for the return type
  } catch (error) {
    console.error("getProductBySlugForEditing Error:", error);
    return null;
  }
}

// UPDATE
export async function updateProductAction(productId: string, data: ProductFormData): Promise<ProductActionResponse> {
  if (!ObjectId.isValid(productId)) {
    return { success: false, message: "Invalid product ID format." };
  }

  const validatedFields = internalProductFormSchema.safeParse(data);
  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(errors).flat().join(', ');
    return { success: false, message: "Invalid product data: " + errorMessages };
  }

  const { _id, ...productDataToUpdate } = validatedFields.data;
  const productObjectId = new ObjectId(productId);

  try {
    const { db } = await connectToDatabase();

    if (productDataToUpdate.slug) {
      // Use ProductDb for the collection
      const existingSlugProduct = await db.collection<ProductDb>('products').findOne({
        slug: productDataToUpdate.slug,
        _id: { $ne: productObjectId } // No 'as any' or 'as ObjectId' needed now!
      });
      if (existingSlugProduct) {
        return { success: false, message: `Another product with slug "${productDataToUpdate.slug}" already exists.` };
      }
    }

    const updateDocument = {
      ...productDataToUpdate,
      updatedAt: new Date()
    };

    const result = await db.collection<ProductDb>('products').updateOne(
      { _id: productObjectId }, // No 'as any' or 'as ObjectId' needed now!
      { $set: updateDocument as Partial<ProductDb> } // Cast for update set
    );

    if (result.matchedCount === 0) {
      return { success: false, message: "Product not found for update." };
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath(`/products/${productDataToUpdate.slug}`);

    return { success: true, message: "Product updated successfully!", slug: productDataToUpdate.slug };
  } catch (error) {
    console.error("updateProductAction Error:", error);
    return { success: false, message: `Error updating product: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// DELETE
export async function deleteProductAction(productId: string): Promise<ProductActionResponse> {
  if (!ObjectId.isValid(productId)) {
    return { success: false, message: "Invalid product ID format." };
  }
  try {
    const { db } = await connectToDatabase();
    const productObjectId = new ObjectId(productId);

    // Use ProductDb for the collection
    const productToDelete = await db.collection<ProductDb>('products').findOne({ _id: productObjectId }); // No 'as any' needed!
    if (!productToDelete) {
      return { success: false, message: "Product not found for deletion." };
    }

    // Use ProductDb for the collection
    const result = await db.collection<ProductDb>('products').deleteOne({ _id: productObjectId }); // No 'as ObjectId' needed!
    if (result.deletedCount === 0) {
      return { success: false, message: "Product could not be deleted or was already deleted." };
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');
    if (productToDelete.slug) {
      revalidatePath(`/products/${productToDelete.slug}`);
    }

    return { success: true, message: "Product deleted successfully!" };
  } catch (error) {
    console.error("deleteProductAction Error:", error);
    return { success: false, message: `Error deleting product: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// SUBMIT REVIEW
export async function submitReviewAction(data: z.infer<typeof reviewFormSchema>): Promise<ReviewActionResponse> {
  const validatedFields = reviewFormSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Invalid review data: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
  }

  const { productId, userId, userName, rating, text } = validatedFields.data;
  const productObjectId = new ObjectId(productId);

  try {
    const { db } = await connectToDatabase();
    // Use ProductDb for the collection
    const productsCollection = db.collection<ProductDb>('products');

    const product = await productsCollection.findOne({ _id: productObjectId }); // No 'as any' needed!
    if (!product) {
      return { success: false, message: "Product not found." };
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews?.find(review => review.userId === userId);
    if (existingReview) {
      return { success: false, message: "You have already reviewed this product." };
    }

    const newReview: Review = {
      _id: new ObjectId().toString(),
      id: new ObjectId().toString(),
      userId: userId,
      userName: userName,
      productId: productId,
      rating: rating,
      text: text,
      date: new Date().toISOString(),
      createdAt: new Date(),
    };

    const updatedReviews = [...(product.reviews || []), newReview];
    const newAverageRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;

    const result = await productsCollection.updateOne(
      { _id: productObjectId }, // No 'as any' needed!
      {
        $push: { reviews: newReview },
        $set: { averageRating: newAverageRating }
      }
    );

    if (result.modifiedCount === 0) {
      return { success: false, message: "Failed to submit review." };
    }

    revalidatePath(`/products/${product.slug}`);

    return { success: true, message: "Thank you! Your review has been submitted." };
  } catch (error) {
    console.error("submitReviewAction Error:", error);
    return { success: false, message: "An unexpected error occurred while submitting your review." };
  }
}