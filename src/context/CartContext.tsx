
"use client";

import type { CartItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    // It ensures that localStorage is accessed only on the client.
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('yarnZooCart');
      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart);
          if (Array.isArray(parsedCart)) {
            setCartItems(parsedCart);
          } else {
            // Handle cases where storedCart is not an array (e.g. old format)
            localStorage.removeItem('yarnZooCart');
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage", error);
          localStorage.removeItem('yarnZooCart'); // Clear corrupted cart
        }
      }
    }
  }, []); // Empty dependency array: runs once on mount (client-side)

  useEffect(() => {
    // This effect also runs only on the client.
    // It saves the cart to localStorage whenever cartItems changes.
    if (typeof window !== 'undefined') {
      localStorage.setItem('yarnZooCart', JSON.stringify(cartItems));
    }
  }, [cartItems]); // Runs whenever cartItems changes

  const addToCart = useCallback((item: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.productId === item.productId);
      if (existingItem) {
        return prevItems.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
            : i
        );
      }
      return [...prevItems, { ...item, quantity: Math.min(item.quantity, item.stock) }];
    });
    toast({ title: "Added to cart!", description: `${item.name} is now in your cart.` });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({ title: "Removed from cart", description: "Item removed successfully." });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast({ title: "Cart cleared", description: "Your shopping cart is now empty." });
  }, [toast]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
