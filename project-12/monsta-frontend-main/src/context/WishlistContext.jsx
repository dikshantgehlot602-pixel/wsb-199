'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const WishlistContext = createContext();

// localStorage is not available during server rendering, so the key is defined
// once here and reused by both the read and the write.
const WISHLIST_STORAGE_KEY = 'wishlist';

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  // Guards the persistence effect until the localStorage read has completed.
  //
  // Why this is needed: on the first render `wishlist` is still the empty array.
  // React runs *all* mount effects in the same commit, so without this flag the
  // save effect would write "[]" to localStorage immediately after the read
  // effect loaded the real wishlist — wiping it. Under React StrictMode (on by
  // default in Next.js) effects are deliberately mounted twice, so the second
  // hydrate pass would then read back the "[]" it had just written, and the
  // wishlist would stay empty after every refresh.
  const [isHydrated, setIsHydrated] = useState(false);

  // Load wishlist from localStorage on mount.
  // Defensive: malformed JSON (or a non-array value) must never crash the
  // app on mount — fall back to the empty wishlist and drop the bad entry.
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        } else {
          localStorage.removeItem(WISHLIST_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } finally {
      // Always release the flag, even if the stored value was unusable, so
      // the wishlist can still be persisted after the user adds an item.
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever the wishlist changes — but never before
  // hydration has read the existing value, otherwise the empty initial state
  // overwrites it.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // Private browsing / storage full — keep the in-memory wishlist usable.
    }
  }, [wishlist, isHydrated]);

  // Add an item; silently ignore duplicates so there are never two entries.
  const addToWishlist = (product) => {
    // Read before updating: the setWishlist updater runs later, so a flag
    // assigned inside it would still be false when checked below.
    if (wishlist.some((item) => item.id === product.id)) {
      return;
    }
    setWishlist((prev) =>
      prev.some((item) => item.id === product.id) ? prev : [...prev, { ...product }]
    );
    toast.success('Added to wishlist! ❤️', {
      toastId: `wishlist-add-${product?.id ?? 'item'}`,
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    toast('Removed from wishlist', {
      icon: '💔',
      toastId: `wishlist-remove-${productId}`,
    });
  };

  // Add if absent, remove if present. Returns nothing (UI reads state).
  const toggleWishlist = (product) => {
    // Same timing note as addToWishlist: decide from current state first.
    const alreadySaved = wishlist.some((item) => item.id === product.id);
    setWishlist((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, { ...product }]
    );
    if (alreadySaved) {
      toast('Removed from wishlist', {
        icon: '💔',
        toastId: `wishlist-remove-${product?.id ?? 'item'}`,
      });
    } else {
      toast.success('Added to wishlist! ❤️', {
        toastId: `wishlist-add-${product?.id ?? 'item'}`,
      });
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isHydrated,
        wishlistCount: wishlist.length,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}