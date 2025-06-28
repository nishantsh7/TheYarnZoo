
import type { Product, Review } from '@/types';
import { connectToDatabase } from './mongodb'; // Import database connection

// Note: This file is being refactored. 
// Mock data arrays (mockReviews, mockProducts) will be removed.
// Functions will now fetch from MongoDB.

// Helper function to convert MongoDB document to Product type
function mapProductDocumentToProduct(doc: any): Product {
  const averageRating = doc.reviews && doc.reviews.length > 0
    ? doc.reviews.reduce((acc: number, review: Review) => acc + review.rating, 0) / doc.reviews.length
    : 0;

  return {
    _id: doc._id?.toString(),
    id: doc.slug, // Use slug as the public-facing ID
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    category: doc.category,
    material: doc.material,
    images: doc.images || [],
    stock: doc.stock,
    reviews: doc.reviews ? doc.reviews.map((r: any) => ({
        ...r,
        _id: r._id?.toString(),
        // Ensure all review fields are present if they come from DB
        id: r.id || r._id?.toString(), // Fallback if specific 'id' field is missing
        date: r.date ? (r.date instanceof Date ? r.date.toISOString() : r.date) : new Date().toISOString(),
    })) : [],
    averageRating: parseFloat(averageRating.toFixed(1)),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}


export async function getPublicProducts(): Promise<Product[]> {
  try {
    const { db } = await connectToDatabase();
    const productDocs = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
    return productDocs.map(mapProductDocumentToProduct);
  } catch (error) {
    console.error("Error fetching public products:", error);
    return [];
  }
}

export async function getPublicProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { db } = await connectToDatabase();
    const productDoc = await db.collection('products').findOne({ slug });
    if (!productDoc) return null;
    return mapProductDocumentToProduct(productDoc);
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    return null;
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const { db } = await connectToDatabase();
    const categories = await db.collection('products').distinct('category');
    return categories.filter(c => typeof c === 'string') as string[]; // Ensure only strings
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getMaterials(): Promise<string[]> {
  try {
    const { db } = await connectToDatabase();
    const materials = await db.collection('products').distinct('material');
    return materials.filter(m => typeof m === 'string') as string[]; // Ensure only strings
  } catch (error) {
    console.error("Error fetching materials:", error);
    return [];
  }
}

export async function getFeaturedProducts(limit: number = 4): Promise<Product[]> {
  try {
    const { db } = await connectToDatabase();
    // Simple implementation: fetch latest products. Could be based on a 'featured' flag later.
    const productDocs = await db.collection('products').find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    return productDocs.map(mapProductDocumentToProduct);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// Old mock data and functions related to it are removed.
// New functions fetch directly from MongoDB.
