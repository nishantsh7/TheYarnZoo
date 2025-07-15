
"use client";

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { getPublicProductBySlug } from '@/lib/mock-data'; // Corrected import path

export default function CartContents() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-headline font-semibold text-gray-700 mb-4">Your Cart is Empty</h2>
        <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground btn-subtle-animate">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {cartItems.map(item => (
        <div key={item.productId} className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 p-4 bg-card rounded-lg shadow">
          <div className="relative w-full md:w-24 h-32 md:h-24 rounded-md overflow-hidden">
            <Image src={item.image} alt={item.name} fill className="object-cover" data-ai-hint="toy product" />
          </div>
          <div className="flex-grow">
            {/* The product slug is not available in the cart item, so linking to /products is a safe fallback */}
            <Link href={`/products`} passHref> 
              <span className="text-lg font-semibold text-foreground hover:text-accent cursor-pointer">{item.name}</span>
            </Link>
            <p className="text-sm text-muted-foreground">Price: ₹{item.price.toFixed(2)}</p>
             <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="h-8 w-8">
              <Minus className="h-4 w-4" />
            </Button>
            <Input 
              type="number" 
              value={item.quantity} 
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value);
                if (!isNaN(newQuantity) && newQuantity > 0 && newQuantity <= item.stock) {
                  updateQuantity(item.productId, newQuantity);
                }
              }}
              min="1"
              max={item.stock}
              className="w-16 h-8 text-center"
            />
            <Button variant="outline" size="icon" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-md font-semibold text-foreground w-24 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.productId)} className="text-destructive hover:text-destructive/80 h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>
      ))}
      
      <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <Button variant="outline" onClick={clearCart} className="border-destructive text-destructive hover:bg-destructive/10">
          Clear Cart
        </Button>
        <div className="text-right space-y-2">
          <p className="text-2xl font-bold text-gray-800">
            Total: <span className="text-accent">₹{getCartTotal().toFixed(2)}</span>
          </p>
          <Button asChild size="lg" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
