"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  updateProductAction,
  type EditProductState,
} from "./actions";

const initial: EditProductState = {};

export function ProductRowEdit({
  product,
}: {
  product: {
    id: string;
    article: string;
    name: string;
    base_price: number;
    base_currency: string;
    stock: number;
    lead_time: string | null;
    is_active: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateProductAction, initial);

  if (state.ok) {
    toast.success(`Сохранено: ${product.article}`);
    state.ok = undefined;
    setOpen(false);
  }
  if (state.error) {
    toast.error(state.error);
    state.error = undefined;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Изменить
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.article}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={product.id} />
          <div className="text-sm text-muted-foreground">{product.name}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">Цена ({product.base_currency})</Label>
              <Input
                id="base_price"
                name="base_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.base_price}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Наличие</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={product.stock}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead_time">Срок поставки</Label>
            <Input
              id="lead_time"
              name="lead_time"
              defaultValue={product.lead_time ?? ""}
              placeholder="3-5 дней"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={product.is_active}
              className="size-4"
            />
            Активен (виден клиентам)
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <SubmitBtn />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем…" : "Сохранить"}
    </Button>
  );
}
