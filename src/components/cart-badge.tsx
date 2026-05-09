"use client";

import { useCartCount } from "@/lib/cart";

export function CartBadge() {
  const count = useCartCount();
  if (count <= 0) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
      {count}
    </span>
  );
}
