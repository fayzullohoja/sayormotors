import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeArticle } from "@/lib/article";
import { applyDiscount, formatPrice } from "@/lib/pricing";
import {
  convertCurrency,
  formatConverted,
  getCurrencyRates,
} from "@/lib/currency";
import type { Currency } from "@/lib/supabase/types";
import { AddToCart } from "./add-to-cart";

export const metadata: Metadata = {
  title: "Поиск",
};

type ProductRow = {
  id: string;
  article: string;
  name: string;
  brand: string | null;
  category: string | null;
  applicability: string | null;
  base_price: number;
  base_currency: string;
  stock: number;
  lead_time: string | null;
  source: string;
  source_country: string | null;
  min_order: number;
  last_imported_at: string | null;
  description: string | null;
};

export default async function SearchPage({
  searchParams,
}: PageProps<"/app/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve discount + preferred currency via company
  const { data: profile } = await supabase
    .from("profiles")
    .select("status, company_id")
    .eq("id", user.id)
    .maybeSingle();
  let discount = 0;
  let preferredCurrency: Currency = "EUR";
  if (profile?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("discount_percent, default_currency")
      .eq("id", profile.company_id)
      .maybeSingle();
    discount = company?.discount_percent ?? 0;
    preferredCurrency = (company?.default_currency as Currency) ?? "EUR";
  }
  const rates = await getCurrencyRates();

  let result: ProductRow | null = null;
  let alternates: ProductRow[] = [];
  let searched = false;
  if (q && profile?.status === "active") {
    searched = true;
    const normalized = normalizeArticle(q);
    if (normalized) {
      const { data } = await supabase
        .from("products")
        .select(
          "id, article, name, brand, category, applicability, base_price, base_currency, stock, lead_time, source, source_country, min_order, last_imported_at, description",
        )
        .eq("article_normalized", normalized)
        .eq("is_active", true)
        .maybeSingle<ProductRow>();
      result = data ?? null;

      // If no exact article match, find ranked alternates via RPC (article + name + brand fuzzy)
      if (!result && q.length >= 2) {
        const { data: similar } = await supabase
          .rpc("search_products", { q, result_limit: 10 } as never)
          .returns<ProductRow[]>();
        alternates = (similar as unknown as ProductRow[]) ?? [];
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Поиск по артикулу</h1>
        <p className="mt-2 text-muted-foreground">
          Введите артикул BMW. Для проверки 50+ артикулов — раздел{" "}
          <a href="/app/bulk" className="text-primary hover:underline">
            Массовая проверка
          </a>
          .
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-3" method="get">
            <Input
              name="q"
              defaultValue={q}
              placeholder="34116859066"
              autoFocus
              className="font-mono"
            />
            <Button type="submit">Найти</Button>
          </form>
        </CardContent>
      </Card>

      {profile?.status !== "active" ? (
        <Alert>
          <AlertDescription>
            Цены и наличие открываются после одобрения аккаунта менеджером.
          </AlertDescription>
        </Alert>
      ) : null}

      {searched && result ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-sm text-muted-foreground">
                  {result.article}
                </div>
                <CardTitle className="mt-1">{result.name}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {result.brand ? <Badge variant="secondary">{result.brand}</Badge> : null}
                  {result.category ? (
                    <Badge variant="outline">{result.category}</Badge>
                  ) : null}
                  <Badge variant="outline">{result.source}</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">
                  {formatPrice(
                    applyDiscount(result.base_price, discount),
                    result.base_currency,
                  )}
                </div>
                {discount > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    <s>{formatPrice(result.base_price, result.base_currency)}</s>{" "}
                    · скидка {discount}%
                  </div>
                ) : null}
                {preferredCurrency !== result.base_currency ? (() => {
                  const converted = convertCurrency(
                    applyDiscount(result.base_price, discount),
                    result.base_currency as Currency,
                    preferredCurrency,
                    rates,
                  );
                  return converted !== null ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      ≈ {formatConverted(converted, preferredCurrency)}
                    </div>
                  ) : null;
                })() : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Stat label="Наличие" value={`${result.stock} шт`} accent={result.stock > 0 ? "ok" : "warn"} />
              <Stat label="Срок" value={result.lead_time ?? "уточнить"} />
              <Stat label="Мин. заказ" value={`${result.min_order} шт`} />
              <Stat
                label="Обновлено"
                value={
                  result.last_imported_at
                    ? new Date(result.last_imported_at).toLocaleDateString("ru")
                    : "—"
                }
              />
            </div>
            {result.applicability ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="text-xs font-medium text-muted-foreground">
                  Применимость
                </div>
                <p className="mt-1">{result.applicability}</p>
              </div>
            ) : null}
            {result.description ? (
              <div className="text-sm text-muted-foreground">
                {result.description}
              </div>
            ) : null}
            {result.stock > 0 ? (
              <AddToCart
                product={{
                  product_id: result.id,
                  article: result.article,
                  name: result.name,
                  brand: result.brand,
                  price: applyDiscount(result.base_price, discount),
                  currency: result.base_currency,
                  lead_time: result.lead_time,
                }}
                minQty={result.min_order}
                maxQty={result.stock}
              />
            ) : (
              <Alert>
                <AlertDescription>
                  Под заказ. Отправьте запрос менеджеру через корзину или укажите в
                  заявке.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : null}

      {searched && !result && alternates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Похожие артикулы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alternates.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div>
                  <div className="font-mono text-xs">{p.article}</div>
                  <div className="font-medium">{p.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatPrice(applyDiscount(p.base_price, discount), p.base_currency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.stock} шт
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {searched && !result && alternates.length === 0 ? (
        <Alert>
          <AlertDescription>
            Артикул <b className="font-mono">{q}</b> не найден в базе. Можно
            отправить индивидуальный запрос менеджеру в корзине.
          </AlertDescription>
        </Alert>
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
  value: string;
  accent?: "ok" | "warn";
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-semibold ${
          accent === "ok" ? "text-emerald-600" : accent === "warn" ? "text-amber-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
