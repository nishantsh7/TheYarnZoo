
"use client";

import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ProductListClientProps {
  initialProducts: Product[];
}

const ALL_FILTER_VALUE = "__ALL__"; // Match the value used in FilterControls

export default function ProductListClient({ initialProducts }: ProductListClientProps) {
  const searchParams = useSearchParams();
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(initialProducts);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  useEffect(() => {
    let tempProducts = [...initialProducts];
    let currentSearchMessage: string | null = null;

    const searchQuery = searchParams.get('search');
    const resultsParam = searchParams.get('results');
    
    // 1. Handle AI Search or Simple Text Search
    if (searchQuery && resultsParam) { // AI Search results
      const resultSlugsOrNames = resultsParam.split(',');
      tempProducts = tempProducts.filter(product => 
        resultSlugsOrNames.some(slugOrName => 
          product.name.toLowerCase().includes(slugOrName.toLowerCase().trim()) || 
          product.slug.toLowerCase().includes(slugOrName.toLowerCase().trim())
        )
      );
      currentSearchMessage = tempProducts.length > 0 
        ? `Showing results for "${searchQuery}" based on your description.`
        : `No products found directly matching your description "${searchQuery}". Try rephrasing or browse categories.`;
    } else if (searchQuery) { // Simple text search (non-AI)
        tempProducts = tempProducts.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        currentSearchMessage = tempProducts.length > 0
            ? `Showing results for "${searchQuery}".`
            : `No products found for "${searchQuery}".`;
    }

    // 2. Apply Manual Filters from searchParams
    const category = searchParams.get('category');
    const material = searchParams.get('material');
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'name_asc';

    if (category && category !== ALL_FILTER_VALUE) {
      tempProducts = tempProducts.filter(p => p.category === category);
    }
    if (material && material !== ALL_FILTER_VALUE) {
      tempProducts = tempProducts.filter(p => p.material === material);
    }

    const minPrice = minPriceStr ? parseFloat(minPriceStr) : null;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : null;

    if (minPrice !== null) {
      tempProducts = tempProducts.filter(p => p.price >= minPrice);
    }
    if (maxPrice !== null) {
      tempProducts = tempProducts.filter(p => p.price <= maxPrice);
    }

    // 3. Apply Sorting
    switch (sortBy) {
      case 'name_asc':
        tempProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        tempProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating_desc':
        tempProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      default:
        tempProducts.sort((a, b) => a.name.localeCompare(b.name)); // Default sort
    }
    
    setDisplayedProducts(tempProducts);
    setSearchMessage(currentSearchMessage);

  }, [searchParams, initialProducts]);

  // Determine message for no products found *after* all filtering
  let finalMessage = searchMessage;
  if (displayedProducts.length === 0 && !searchMessage) {
     finalMessage = "No products match the current filters. Try adjusting your filters or clearing them.";
  } else if (displayedProducts.length === 0 && searchMessage?.startsWith("No products found for")) {
    // Keep the specific search message if simple/AI search yielded no results
  } else if (displayedProducts.length === 0 && searchMessage) {
    finalMessage = `${searchMessage} However, no products match the additional filters applied.`;
  }


  if (displayedProducts.length === 0) {
     return (
        <div className="w-full text-center py-10">
           {finalMessage && (
            <Alert className="mb-6 bg-secondary border-primary/30 text-primary-foreground text-left">
              <Info className="h-5 w-5 text-primary-foreground/80" />
              <AlertTitle className="font-semibold">Filter Results</AlertTitle>
              <AlertDescription>
                {finalMessage}
              </AlertDescription>
            </Alert>
          )}
          {!finalMessage && <p className="text-xl text-muted-foreground">No products available.</p>}
        </div>
      );
  }
  
  return (
    <div className="w-full">
      {searchMessage && displayedProducts.length > 0 && ( // Only show search message if there are results to qualify
        <Alert className="mb-6 bg-secondary border-primary/30 text-primary-foreground">
          <Info className="h-5 w-5 text-primary-foreground/80" />
          <AlertTitle className="font-semibold">Search Information</AlertTitle>
          <AlertDescription>
            {searchMessage}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

