
import ProductForm from '../../ProductForm';
import { getProductBySlugForEditing, updateProductAction, type ProductFormData, type ProductActionResponse } from '@/actions/productActions';
import { notFound } from 'next/navigation';
import type { Product } from '@/types';

// Server action bound with productId for updates
async function handleEditProduct(productId: string, data: ProductFormData): Promise<ProductActionResponse> {
  "use server";
  if (!productId) {
    return { success: false, message: "Product ID is missing for update." };
  }
  return updateProductAction(productId, data);
}

export default async function EditProductPage({ params }: { params: { slug: string }}) {
  const product = await getProductBySlugForEditing(params.slug);

  if (!product || !product._id) { // Ensure product and its MongoDB _id exist
    notFound();
  }

  // Bind the product's MongoDB _id to the server action for updating
  const boundEditProductAction = handleEditProduct.bind(null, product._id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-gray-800">Edit Product: {product.name}</h1>
      {/* Pass the full product object, which includes _id, to initialData */}
      <ProductForm initialData={product} onSubmitForm={boundEditProductAction} isEditing={true} />
    </div>
  );
}

