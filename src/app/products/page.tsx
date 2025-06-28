
import { Suspense } from 'react';
import { getPublicProducts, getCategories, getMaterials } from '@/lib/mock-data'; // Will be product-data.ts
import FilterControls from '@/components/products/FilterControls';
import ProductListClient from '@/components/products/ProductListClient';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Our Products - TheYarnZoo',
  description: 'Browse our collection of handcrafted crocheted toys.',
};

interface ProductsPageProps {
  searchParams: {
    category?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    search?: string;
    results?: string; 
  };
}

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg shadow-lg overflow-hidden">
          <Skeleton className="w-full aspect-square rounded-t-lg" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-1/4 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const allProducts = await getPublicProducts();
  const categories = await getCategories(); // Fetch from DB
  const materials = await getMaterials();   // Fetch from DB
  const maxPrice = allProducts.length > 0 ? Math.max(...allProducts.map(p => p.price), 100) : 100;


  // Initial filtering based on searchParams is now handled inside ProductListClient for better UX with AI search results
  // The initialProducts passed to ProductListClient will be the full set, 
  // and client-side logic will apply filters or AI results.

  // Sorting will also be managed client-side or via refetch if we add pagination later.
  // For now, ProductListClient handles display logic based on params.
  // We pass all products and let the client component handle the dynamic filtering/sorting based on URL.

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold text-center text-gray-700 mb-12">Our Lovely Toys</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <FilterControls categories={categories} materials={materials} maxPrice={maxPrice} />
        <main className="flex-1">
          <Suspense fallback={<ProductListSkeleton />}>
            {/* Pass all products fetched from DB. ProductListClient will handle filtering based on searchParams */}
            <ProductListClient initialProducts={allProducts} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
