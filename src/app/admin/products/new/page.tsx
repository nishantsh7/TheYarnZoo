
import ProductForm from '../ProductForm';
import { createProductAction, type ProductFormData, type ProductActionResponse } from '@/actions/productActions';

async function handleAddProduct(data: ProductFormData): Promise<ProductActionResponse> {
  "use server";
  return createProductAction(data);
}

export default function AddNewProductPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-gray-800">Add New Product</h1>
      <ProductForm onSubmitForm={handleAddProduct} />
    </div>
  );
}
