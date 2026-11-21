'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

// localStorage is not available during server rendering, so the key is defined
// once here and reused by both the read and the write.
const CART_STORAGE_KEY = 'cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Guards the persistence effect until the localStorage read has completed.
  //
  // Why this is needed: on the first render `cart` is still the empty array.
  // React runs *all* mount effects in the same commit, so without this flag the
  // save effect would write "[]" to localStorage immediately after the read
  // effect loaded the real cart — wiping it. Under React StrictMode (on by
  // default in Next.js) effects are deliberately mounted twice, so the second
  // hydrate pass would then read back the "[]" it had just written, and the
  // cart would stay empty after every refresh.
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount.
  // Defensive: malformed JSON (or a non-array value) must never crash the
  // app on mount — fall back to the empty cart and drop the bad entry.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        } else {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      // Always release the flag, even if the stored value was unusable, so
      // the cart can still be persisted after the user starts a fresh cart.
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever cart changes — but never before hydration
  // has read the existing value, otherwise the empty initial state overwrites it.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Private browsing / storage full — keep the in-memory cart usable.
    }
  }, [cart, isHydrated]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    // Deduped: rapid clicks for the same product update one toast.
    toast.success('Product added to cart!', {
      toastId: `cart-add-${product?.id ?? 'item'}`,
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    toast.success('Product removed from cart', {
      toastId: `cart-remove-${productId}`,
    });
  };

  // Empties the cart entirely (used after a verified successful payment).
  // The persistence effect writes the empty array to localStorage once
  // hydration has completed, consistent with the rest of this context.
  // Wishlist/product data are separate and unaffected.
  // `silent` skips the toast — checkout already shows its own order-success
  // toast, so it clears silently to avoid a second "Cart cleared" toast.
  const clearCart = (options) => {
    setCart([]);
    if (options?.silent) {
      return;
    }
    toast.success('Cart cleared', {
      toastId: 'cart-cleared',
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getCartTotal = () => {
    // Coerce with Number() and skip non-positive/missing values. Cart data can
    // come from localStorage (hand-edited or written by an older build) where
    // price/quantity may be strings; without coercion "5000" * "2" silently
    // yields NaN and the whole total renders as "Rs. NaN".
    return cart.reduce((total, item) => {
      const price = Number(item?.price);
      const quantity = Number(item?.quantity);

      if (!Number.isFinite(price) || !Number.isFinite(quantity) || price < 0 || quantity < 0) {
        return total;
      }

      return total + price * quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isHydrated,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}