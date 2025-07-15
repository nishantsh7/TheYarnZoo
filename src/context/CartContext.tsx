
"use client";

import type { CartItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useSession } from 'next-auth/react';

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
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const isInitialLoad = useRef(true);

  // Load cart from localStorage when user session changes or on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && status === 'authenticated' && userId) {
      const storedCart = localStorage.getItem(`yarnZooCart_${userId}`);
      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart);
          if (Array.isArray(parsedCart)) {
            setCartItems(parsedCart);
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage", error);
          localStorage.removeItem(`yarnZooCart_${userId}`);
        }
      } else {
        setCartItems([]); // No cart for this user yet
      }
    } else if (status === 'unauthenticated') {
      // Clear cart when user logs out
      setCartItems([]);
    }
    isInitialLoad.current = false;
  }, [status, userId]);

  // Save cart to localStorage whenever it changes for a logged-in user
  useEffect(() => {
    // Prevent saving an empty initial cart over an existing one
    if (typeof window !== 'undefined' && userId && !isInitialLoad.current) {
      localStorage.setItem(`yarnZooCart_${userId}`, JSON.stringify(cartItems));
    }
  }, [cartItems, userId]);

  const addToCart = useCallback((item: CartItem) => {
    if (!userId) {
        toast({ title: "Please Log In", description: "You need to be logged in to add items to your cart.", variant: "destructive"});
        return;
    }
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.productId === item.productId);
      if (existingItem) {
        const newQuantity = existingItem.quantity + item.quantity;
        if (newQuantity > existingItem.stock) {
            toast({ title: "Stock Limit", description: `You can't add more of ${item.name}. Only ${existingItem.stock} available.`, variant: "destructive"});
            return prevItems;
        }
        toast({ title: "Updated in cart!", description: `${item.name} quantity increased.` });
        return prevItems.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: newQuantity }
            : i
        );
      }
      toast({ title: "Added to cart!", description: `${item.name} is now in your cart.` });
      return [...prevItems, { ...item, quantity: Math.min(item.quantity, item.stock) }];
    });
  }, [userId, toast]);

  const removeFromCart = useCallback((productId: string) => {
    if (!userId) return;
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({ title: "Removed from cart", description: "Item removed successfully." });
  }, [userId, toast]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (!userId) return;
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) } : item
      )
    );
  }, [userId]);

  const clearCart = useCallback(() => {
    if (!userId) return;
    setCartItems([]);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(`yarnZooCart_${userId}`);
    }
    toast({ title: "Cart Cleared", description: "All items have been removed from your cart."});
  }, [userId, toast]);

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
