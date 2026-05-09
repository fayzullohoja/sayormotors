"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type CartItem = {
  product_id: string;
  article: string;
  name: string;
  brand: string | null;
  qty: number;
  price: number;
  currency: string;
  lead_time: string | null;
};

const STORAGE_KEY = "sayormotors:cart:v1";
const EVENT = "sayormotors:cart:changed";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, () => read(), () => []);

  const addItem = (item: Omit<CartItem, "qty">, qty = 1) => {
    const existing = read();
    const idx = existing.findIndex((i) => i.product_id === item.product_id);
    if (idx >= 0) {
      existing[idx].qty += qty;
    } else {
      existing.push({ ...item, qty });
    }
    write(existing);
  };

  const setItemQty = (productId: string, qty: number) => {
    const existing = read();
    const idx = existing.findIndex((i) => i.product_id === productId);
    if (idx >= 0) {
      if (qty <= 0) existing.splice(idx, 1);
      else existing[idx].qty = qty;
      write(existing);
    }
  };

  const removeItem = (productId: string) => {
    write(read().filter((i) => i.product_id !== productId));
  };

  const clear = () => write([]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return { items, addItem, setItemQty, removeItem, clear, count, total };
}

// Lightweight badge component reads count without subscribing to full items
export function useCartCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(read().reduce((s, i) => s + i.qty, 0));
    update();
    return subscribe(update);
  }, []);
  return count;
}
