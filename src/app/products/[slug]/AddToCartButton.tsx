
'use client';

import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!product._id) {
      console.error("Product _id is missing, cannot add to cart");
      return;
    }
    addToCart({
      productId: product._id, // Use the database _id
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: quantity,
      stock: product.stock,
    });
    setQuantity(1); // Reset quantity after adding
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > product.stock) val = product.stock;
    setQuantity(val);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-24">
        <Input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min="1"
          max={product.stock > 0 ? product.stock : 1} // Ensure max is at least 1 even if stock is 0
          disabled={product.stock === 0}
          className="text-center h-12 text-lg"
          aria-label="Quantity"
        />
      </div>
      <Button 
        size="lg" 
        onClick={handleAddToCart} 
        disabled={product.stock === 0 || quantity > product.stock}
        className="flex-grow bg-primary hover:bg-primary/90 text-primary-foreground btn-subtle-animate text-base"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {product.stock > 0 ? (quantity > product.stock ? 'Not enough stock' : 'Add to Cart') : 'Out of Stock'}
      </Button>
    </div>
  );
}
