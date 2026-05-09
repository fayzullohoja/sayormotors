import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductRowEdit } from "./row-edit";
import { normalizeArticle } from "@/lib/article";

export const metadata: Metadata = {
  title: "Товары",
};

const PAGE_SIZE = 50;

type ProductRow = {
  id: string;
  article: string;
  article_normalized: string;
  name: string;
  brand: string | null;
  category: string | null;
  base_price: number;
  base_currency: string;
  stock: number;
  lead_time: string | null;
  source: string;
  is_active: boolean;
  last_imported_at: string | null;
};

export default async function ProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));
  const onlyActive = sp.active === "1";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select(
      "id, article, article_normalized, name, brand, category, base_price, base_currency, stock, lead_time, source, is_active, last_imported_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });

  if (q) {
    const normalized = normalizeArticle(q);
    const safe = q.replace(/,/g, " ");
    if (normalized) {
      query = query.or(
        `article_normalized.ilike.%${normalized}%,name.ilike.%${safe}%,brand.ilike.%${safe}%`,
      );
    } else {
      query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`);
    }
  }
  if (onlyActive) query = query.eq("is_active", true);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count } = await query.range(from, to).returns<ProductRow[]>();

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Товары</h1>
          <p className="mt-2 text-muted-foreground">
            Всего: {total.toLocaleString("ru")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/imports">Загрузить Excel</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Артикул или название"
              className="max-w-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                value="1"
                defaultChecked={onlyActive}
                className="size-4"
              />
              Только активные
            </label>
            <Button type="submit">Найти</Button>
            {q || onlyActive ? (
              <Button variant="ghost" asChild>
                <Link href="/admin/products">Сбросить</Link>
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {data && data.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Артикул</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Бренд</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Наличие</TableHead>
                <TableHead>Срок</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead className="w-32 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.article}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="line-clamp-1">{p.name}</div>
                    {p.category ? (
                      <div className="text-xs text-muted-foreground">
                        {p.category}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{p.brand ?? "—"}</TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {p.base_price.toFixed(2)} {p.base_currency}
                    </div>
                  </TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.lead_time ?? "—"}
                  </TableCell>
                  <TableCell>
                    {p.is_active ? (
                      <Badge>Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Скрыт</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductRowEdit
                      product={{
                        id: p.id,
                        article: p.article,
                        name: p.name,
                        base_price: p.base_price,
                        base_currency: p.base_currency,
                        stock: p.stock,
                        lead_time: p.lead_time,
                        is_active: p.is_active,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Товаров не найдено. Загрузите Excel-файл, чтобы наполнить каталог.
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Страница {page} из {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={{
                    pathname: "/admin/products",
                    query: {
                      ...sp,
                      page: String(page - 1),
                    },
                  }}
                >
                  Назад
                </Link>
              </Button>
            ) : null}
            {page < totalPages ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={{
                    pathname: "/admin/products",
                    query: { ...sp, page: String(page + 1) },
                  }}
                >
                  Вперёд
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
