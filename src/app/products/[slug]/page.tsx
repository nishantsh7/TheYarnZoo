
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublicProductBySlug, getPublicProducts } from '@/lib/mock-data'; // Corrected import path
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, MessageSquare, ChevronLeft } from 'lucide-react';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewForm from '@/components/reviews/ReviewForm';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton'; 

export async function generateStaticParams() {
  const products = await getPublicProducts(); 
  return products.map(product => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string }}) {
  const product = await getPublicProductBySlug(params.slug); 
  if (!product) {
    return { title: 'Product Not Found' };
  }
  return {
    title: `${product.name} - TheYarnZoo`,
    description: product.description.substring(0, 160),
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string }}) {
  const product = await getPublicProductBySlug(params.slug); 
  
  if (!product) {
    notFound();
  }

  const allProducts = await getPublicProducts(); 
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const averageRating = product.reviews && product.reviews.length > 0 
    ? (product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length).toFixed(1)
    : "No ratings yet";

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <Link href="/products" className="inline-flex items-center text-accent hover:text-accent/80 mb-6 btn-subtle-animate">
        <ChevronLeft className="mr-1 h-5 w-5" /> Back to Products
      </Link>

      <section className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Product Images */}
        <div className="bg-card p-4 rounded-lg shadow-lg">
          <div className="relative aspect-square w-full">
            <Image
              src={product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/600x400.png'}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover rounded-md"
              data-ai-hint={`${product.category.toLowerCase()} ${product.name.toLowerCase().split(' ')[0]}`}
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {product.images.slice(0,4).map((img, index) => (
                <div key={index} className="relative aspect-square border border-border rounded-md overflow-hidden cursor-pointer hover:border-accent">
                   <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover" data-ai-hint={`${product.category.toLowerCase()} ${product.name.toLowerCase().split(' ')[0]}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <h1 className="text-4xl font-headline font-bold text-gray-800">{product.name}</h1>
          <div className="flex items-center space-x-2">
            <div className="flex">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className={`h-6 w-6 ${product.averageRating && i < Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`} />
              ))}
            </div>
            <span className="text-muted-foreground text-sm">
              {averageRating} ({product.reviews ? product.reviews.length : 0} reviews)
            </span>
          </div>
          <p className="text-2xl font-semibold text-accent">₹{product.price.toFixed(2)}</p>
          <p className="text-foreground leading-relaxed">{product.description}</p>
          
          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Category:</span> {product.category}</p>
            <p><span className="font-semibold">Material:</span> {product.material}</p>
            <p><span className="font-semibold">Availability:</span> 
              <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
                {product.stock > 0 ? ` In Stock (${product.stock} left)` : ' Out of Stock'}
              </span>
            </p>
          </div>
          
          <AddToCartButton product={product} />

        </div>
      </section>

      {/* Reviews Section */}
      <section className="pt-8 border-t border-border">
        <h2 className="text-3xl font-headline font-semibold text-gray-700 mb-8 flex items-center">
          <MessageSquare className="mr-3 h-7 w-7 text-accent" /> Customer Reviews
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map(review => <ReviewCard key={review.id} review={review} />)
            ) : (
              <p className="text-muted-foreground">Be the first to review this product!</p>
            )}
          </div>
          <div>
            <ReviewForm productId={product._id!} /> 
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-border">
          <h2 className="text-3xl font-headline font-semibold text-center text-gray-700 mb-10">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct: Product) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
