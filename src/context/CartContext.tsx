import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItem = {
  id: string;
  size: string;
  color: string;
  qty: number;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (id: string, size: string, qty: number, color?: string) => void;
  removeFromCart: (id: string, size: string, color?: string) => void;
  updateQuantity: (id: string, size: string, qty: number, color?: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "little-luxuries-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartItem[];
        setCart(
          parsed.map((item) => ({
            ...item,
            color: item.color ?? "",
          })),
        );
      } catch (e) {
        console.error("Failed to parse cart from localStorage:", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const matchCartLine = (item: CartItem, id: string, size: string, color = "") =>
    item.id === id && item.size === size && (item.color || "") === color;

  const addToCart = (id: string, size: string, qty: number, color = "") => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => matchCartLine(item, id, size, color));
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + qty,
        };
        return updated;
      }
      return [...prev, { id, size, color, qty }];
    });
  };

  const removeFromCart = (id: string, size: string, color = "") => {
    setCart((prev) => prev.filter((item) => !matchCartLine(item, id, size, color)));
  };

  const updateQuantity = (id: string, size: string, qty: number, color = "") => {
    if (qty <= 0) {
      removeFromCart(id, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (matchCartLine(item, id, size, color) ? { ...item, qty } : item)),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
