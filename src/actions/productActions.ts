
'use server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import type { Product } from '@/types';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';

// Define the schema directly inside actions or import from a non-'use server' util file if needed elsewhere.
// For now, actions will parse based on an internal or passed schema structure.
// The ProductFormData type will be crucial for type safety.

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

export type ProductFormData = z.infer<typeof internalProductFormSchema>;

export type ProductActionResponse = {
  success: boolean;
  message: string;
  productId?: string;
  slug?: string;
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
    const existingProductBySlug = await db.collection<Product>('products').findOne({ slug: productData.slug });
    if (existingProductBySlug) {
      return { success: false, message: `Product with slug "${productData.slug}" already exists.` };
    }

    const newProductDocument: Omit<Product, 'id' | '_id' | 'reviews' | 'averageRating'> = {
      ...productData,
      reviews: [],
      averageRating: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('products').insertOne(newProductDocument);
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
    const productDocs = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
    
    return productDocs.map(p => ({
      ...p,
      _id: p._id.toString(),
      id: p.slug, 
      reviews: p.reviews || [],
      averageRating: p.averageRating || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })) as Product[];
  } catch (error) {
    console.error("getAdminProducts Error:", error);
    return [];
  }
}

// READ (single product for editing, by slug)
export async function getProductBySlugForEditing(slug: string): Promise<Product | null> {
  try {
    const { db } = await connectToDatabase();
    const productDoc = await db.collection('products').findOne({ slug });
    if (!productDoc) return null;
    
    return {
      ...productDoc,
      _id: productDoc._id.toString(),
      id: productDoc.slug,
      reviews: productDoc.reviews || [],
      averageRating: productDoc.averageRating || 0,
    } as Product;
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
      const existingSlugProduct = await db.collection<Product>('products').findOne({
        slug: productDataToUpdate.slug,
        _id: { $ne: productObjectId }
      });
      if (existingSlugProduct) {
        return { success: false, message: `Another product with slug "${productDataToUpdate.slug}" already exists.` };
      }
    }
    
    const updateDocument = {
      ...productDataToUpdate,
      updatedAt: new Date()
    };

    const result = await db.collection('products').updateOne(
      { _id: productObjectId },
      { $set: updateDocument }
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

    const productToDelete = await db.collection('products').findOne({ _id: productObjectId });
    if (!productToDelete) {
      return { success: false, message: "Product not found for deletion." };
    }

    const result = await db.collection('products').deleteOne({ _id: productObjectId });
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
