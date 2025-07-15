
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent link navigation when clicking the button
    if (!product._id) {
      console.error("Product _id is missing, cannot add to cart");
      return;
    }
    addToCart({
      productId: product._id, // Use the database _id
      name: product.name,
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/300x300.png',
      quantity: 1,
      stock: product.stock,
    });
  };
  
  const displayRating = product.averageRating && product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New';

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover-lift group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative w-full aspect-square">
          <Image
            src={product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/600x400.png'}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={`${product.category.toLowerCase()} ${product.name.toLowerCase().split(' ')[0]}`}
          />
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="text-lg font-headline font-semibold text-foreground mb-1 truncate">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-2">{product.category} - {product.material}</p>
        <div className="flex items-center mb-3">
          <Star className={`h-5 w-5 ${product.averageRating && product.averageRating > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
          <span className="ml-1 text-sm text-muted-foreground">
            {displayRating} {product.reviews && product.reviews.length > 0 ? `(${product.reviews.length} reviews)` : ''}
          </span>
        </div>
        <p className="text-xl font-semibold text-accent mb-4">₹{product.price.toFixed(2)}</p>
        <div className="mt-auto">
          <Button 
            onClick={handleAddToCart} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground btn-subtle-animate"
            disabled={product.stock === 0}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
