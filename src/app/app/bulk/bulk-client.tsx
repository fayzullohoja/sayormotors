"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/pricing";
import { bulkCheckAction, type BulkResult } from "./actions";

export function BulkClient() {
  const [result, setResult] = useState<BulkResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addItem } = useCart();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const r = await bulkCheckAction(formData);
      if (!r.ok) {
        toast.error(r.error ?? "Ошибка");
        setResult(null);
        return;
      }
      setResult(r);
      if (r.found === 0) {
        toast.warning("Ничего не найдено в каталоге");
      }
    });
  };

  const addAllFound = () => {
    if (!result) return;
    let count = 0;
    for (const row of result.rows) {
      if (!row.product) continue;
      addItem(
        {
          product_id: row.product.id,
          article: row.product.article,
          name: row.product.name,
          brand: row.product.brand,
          price: row.product.display_price,
          currency: row.product.base_currency,
          lead_time: row.product.lead_time,
        },
        row.qty,
      );
      count++;
    }
    toast.success(`Добавлено ${count} позиций в корзину`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="paste">
        <TabsList>
          <TabsTrigger value="paste">Вставить список</TabsTrigger>
          <TabsTrigger value="upload">Загрузить Excel</TabsTrigger>
        </TabsList>
        <TabsContent value="paste" className="pt-4">
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">
                Артикулы (по одному в строке; можно с количеством через пробел)
              </Label>
              <Textarea
                id="text"
                name="text"
                rows={10}
                className="font-mono"
                placeholder={`34116859066 10
13718518111 5
11428507683
63117419615`}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Проверяем…" : "Проверить"}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="upload" className="pt-4">
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Excel-файл (.xlsx, .xls, .csv)</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".xlsx,.xls,.csv"
              />
              <p className="text-xs text-muted-foreground">
                Первая колонка — артикулы. Если есть колонка с количеством, она
                подхватится автоматически. До 200 строк.
              </p>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Проверяем…" : "Проверить"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/30 p-4">
            <Stat label="Всего" value={result.total} />
            <Stat label="Найдено" value={result.found} accent="ok" />
            <Stat label="Не найдено" value={result.missing} accent="warn" />
          </div>
          {result.found > 0 ? (
            <div className="flex justify-end">
              <Button onClick={addAllFound}>
                Добавить найденные ({result.found}) в корзину
              </Button>
            </div>
          ) : null}
          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Артикул</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Запрошено</TableHead>
                  <TableHead>Наличие</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Срок</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((r, idx) => (
                  <TableRow key={`${r.input}-${idx}`}>
                    <TableCell className="font-mono text-xs">
                      {r.input}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {r.product ? (
                        <div className="line-clamp-1">{r.product.name}</div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{r.qty}</TableCell>
                    <TableCell>
                      {r.product ? (
                        <span
                          className={
                            r.product.stock >= r.qty
                              ? "text-emerald-600"
                              : r.product.stock > 0
                                ? "text-amber-600"
                                : "text-rose-600"
                          }
                        >
                          {r.product.stock}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {r.product
                        ? formatPrice(
                            r.product.display_price,
                            r.product.base_currency,
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.product?.lead_time ?? "—"}
                    </TableCell>
                    <TableCell>
                      {!r.product ? (
                        <Badge variant="secondary">Не найден</Badge>
                      ) : r.product.stock >= r.qty ? (
                        <Badge>Есть</Badge>
                      ) : r.product.stock > 0 ? (
                        <Badge variant="secondary">Частично</Badge>
                      ) : (
                        <Badge variant="destructive">Нет</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {result.missing > 0 ? (
            <Alert>
              <AlertDescription>
                Не найденные артикулы можно отправить запросом менеджеру при
                оформлении заявки в корзине.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "ok" | "warn";
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-semibold ${
          accent === "ok" ? "text-emerald-600" : accent === "warn" ? "text-amber-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
