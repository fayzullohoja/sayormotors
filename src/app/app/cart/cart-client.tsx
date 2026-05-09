"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/pricing";
import { submitRequestAction } from "./actions";

export function CartClient({
  contact,
  canSubmit,
}: {
  contact: {
    email: string;
    companyName: string | null;
    fullName: string;
    phone: string;
    telegram: string;
    whatsapp: string;
  };
  canSubmit: boolean;
}) {
  const { items, setItemQty, removeItem, clear } = useCart();
  const [contactMethod, setContactMethod] = useState("phone");
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const totalsByCurrency = new Map<string, number>();
  for (const i of items) {
    totalsByCurrency.set(
      i.currency,
      (totalsByCurrency.get(i.currency) ?? 0) + i.qty * i.price,
    );
  }
  const onlyOneCurrency = totalsByCurrency.size <= 1;

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Корзина пуста.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/app/search">К поиску</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(
        "Аккаунт ещё не одобрен. Свяжитесь с менеджером для активации.",
      );
      return;
    }
    startTransition(async () => {
      const res = await submitRequestAction({
        items: items.map((it) => ({
          product_id: it.product_id,
          article: it.article,
          name: it.name,
          brand: it.brand,
          qty: it.qty,
          price: it.price,
          currency: it.currency,
        })),
        contact_method: contactMethod,
        client_comment: comment,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      clear();
      toast.success(`Заявка №${res.number} отправлена`);
      router.push(`/app/requests/${res.requestId}`);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Позиции ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Артикул</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-32">Кол-во</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.product_id}>
                  <TableCell className="font-mono text-xs">
                    {it.article}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="line-clamp-1">{it.name}</div>
                    {it.brand ? (
                      <div className="text-xs text-muted-foreground">
                        {it.brand}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) =>
                        setItemQty(
                          it.product_id,
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>{formatPrice(it.price, it.currency)}</TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(it.qty * it.price, it.currency)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => removeItem(it.product_id)}
                      className="text-sm text-muted-foreground hover:text-destructive"
                      aria-label="Удалить"
                    >
                      ×
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={clear}>
              Очистить корзину
            </Button>
            <div className="space-y-1 text-right">
              {onlyOneCurrency ? (
                <div className="text-2xl font-semibold">
                  {formatPrice(total, items[0].currency)}
                </div>
              ) : (
                <div className="space-y-0.5 text-sm">
                  {Array.from(totalsByCurrency.entries()).map(([cur, sum]) => (
                    <div key={cur} className="font-medium">
                      {formatPrice(sum, cur)}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Цены ориентировочные · подтверждает менеджер
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Контакт для связи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Field label="Компания" value={contact.companyName ?? "—"} />
            <Field label="ФИО" value={contact.fullName || "—"} />
            <Field label="Email" value={contact.email} />
            <Field label="Телефон" value={contact.phone || "—"} />
            <Field label="Telegram" value={contact.telegram || "—"} />
            <Field label="WhatsApp" value={contact.whatsapp || "—"} />
            <Link
              href="/app/profile"
              className="block text-xs text-primary hover:underline"
            >
              Изменить контактные данные
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Оформление заявки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Способ связи</Label>
              <Select value={contactMethod} onValueChange={setContactMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Телефон</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Комментарий менеджеру</Label>
              <Textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Сроки, особые условия, дополнительные пожелания"
              />
            </div>
            {!canSubmit ? (
              <Alert>
                <AlertDescription>
                  Заявку можно будет отправить после одобрения аккаунта.
                </AlertDescription>
              </Alert>
            ) : null}
            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending || !canSubmit}
            >
              {isPending ? "Отправляем…" : `Отправить заявку (${items.length})`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
