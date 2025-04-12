import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Basket } from '../types/basket';

interface CartItem {
  basket: Basket;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (basket: Basket, quantity: number) => void;
  removeItem: (basketId: string) => void;
  updateQuantity: (basketId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotalPrice: () => 0,
  getTotalItems: () => 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (basket: Basket, quantity: number) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.basket.id === basket.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.basket.id === basket.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { basket, quantity }];
    });
  };

  const removeItem = (basketId: string) => {
    setItems(prevItems => prevItems.filter(item => item.basket.id !== basketId));
  };

  const updateQuantity = (basketId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(basketId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.basket.id === basketId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.basket.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
};