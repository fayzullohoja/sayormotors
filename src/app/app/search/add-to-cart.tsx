"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCart, type CartItem } from "@/lib/cart";

export function AddToCart({
  product,
  minQty,
  maxQty,
}: {
  product: Omit<CartItem, "qty">;
  minQty: number;
  maxQty: number;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(minQty);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="qty">Количество</Label>
        <Input
          id="qty"
          type="number"
          min={minQty}
          max={maxQty}
          value={qty}
          onChange={(e) => setQty(Math.max(minQty, Math.min(maxQty, parseInt(e.target.value, 10) || minQty)))}
          className="w-32"
        />
      </div>
      <Button
        size="lg"
        onClick={() => {
          addItem(product, qty);
          toast.success(`Добавлено в корзину: ${product.article} × ${qty}`);
        }}
      >
        Добавить в корзину
      </Button>
    </div>
  );
}
