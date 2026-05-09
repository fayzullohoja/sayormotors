"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  REQUEST_STATUS_LABEL,
  REQUEST_ITEM_STATUS_LABEL,
} from "@/lib/request-status";
import type {
  Currency,
  RequestStatus,
  RequestItemStatus,
} from "@/lib/supabase/types";
import { saveRequestUpdates } from "./actions";

type Item = {
  id: string;
  article: string;
  name: string | null;
  brand: string | null;
  qty_requested: number;
  qty_confirmed: number | null;
  price_at_request: number | null;
  price_confirmed: number | null;
  currency: Currency | null;
  status: RequestItemStatus;
  manager_comment: string | null;
};

const REQUEST_STATUSES: RequestStatus[] = [
  "new",
  "in_progress",
  "awaiting_clarification",
  "confirmed",
  "partial",
  "awaiting_payment",
  "ordered",
  "ready_for_shipment",
  "completed",
  "cancelled",
];

const ITEM_STATUSES: RequestItemStatus[] = [
  "pending",
  "confirmed",
  "partial",
  "unavailable",
];

export function ManageForm({
  requestId,
  currentStatus,
  currentManagerComment,
  assigned,
  items: initialItems,
}: {
  requestId: string;
  currentStatus: RequestStatus;
  currentManagerComment: string;
  assigned: boolean;
  items: Item[];
}) {
  const [status, setStatus] = useState<RequestStatus>(currentStatus);
  const [managerComment, setManagerComment] = useState(currentManagerComment);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [assignToMe, setAssignToMe] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveRequestUpdates({
        requestId,
        status,
        manager_comment: managerComment,
        assign_to_me: assignToMe ? true : undefined,
        items: items.map((i) => ({
          id: i.id,
          status: i.status,
          qty_confirmed: i.qty_confirmed,
          price_confirmed: i.price_confirmed,
          manager_comment: i.manager_comment,
        })),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Сохранено");
    });
  };

  return (
    <div className="space-y-6">
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Артикул / Название</TableHead>
              <TableHead className="w-20">Запр.</TableHead>
              <TableHead className="w-28">Подтв.</TableHead>
              <TableHead className="w-32">Цена</TableHead>
              <TableHead className="w-36">Статус</TableHead>
              <TableHead className="min-w-[200px]">Комментарий</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="max-w-xs">
                  <div className="font-mono text-xs">{it.article}</div>
                  <div className="line-clamp-1">{it.name ?? "—"}</div>
                  {it.brand ? (
                    <div className="text-xs text-muted-foreground">
                      {it.brand}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>{it.qty_requested}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={
                      it.qty_confirmed === null ? "" : String(it.qty_confirmed)
                    }
                    placeholder={String(it.qty_requested)}
                    onChange={(e) =>
                      updateItem(it.id, {
                        qty_confirmed:
                          e.target.value === ""
                            ? null
                            : Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="h-9"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={
                      it.price_confirmed === null
                        ? ""
                        : String(it.price_confirmed)
                    }
                    placeholder={
                      it.price_at_request != null
                        ? `${it.price_at_request} ${it.currency ?? ""}`
                        : "цена"
                    }
                    onChange={(e) =>
                      updateItem(it.id, {
                        price_confirmed:
                          e.target.value === ""
                            ? null
                            : Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="h-9"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={it.status}
                    onValueChange={(v) =>
                      updateItem(it.id, { status: v as RequestItemStatus })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {REQUEST_ITEM_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={it.manager_comment ?? ""}
                    onChange={(e) =>
                      updateItem(it.id, {
                        manager_comment: e.target.value || null,
                      })
                    }
                    placeholder="Комментарий"
                    className="h-9"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <div className="space-y-2">
          <Label>Статус заявки</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as RequestStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {REQUEST_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!assigned ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={assignToMe}
                onChange={(e) => setAssignToMe(e.target.checked)}
                className="size-4"
              />
              Закрепить заявку за мной
            </label>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="manager_comment">Комментарий менеджера (виден клиенту)</Label>
          <Textarea
            id="manager_comment"
            rows={3}
            value={managerComment}
            onChange={(e) => setManagerComment(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Сохраняем…" : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}
