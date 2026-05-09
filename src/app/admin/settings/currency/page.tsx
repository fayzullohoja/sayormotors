import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CurrencyRatesForm } from "./form";
import type { Currency } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Курсы валют",
};

type RateRow = {
  code: Currency;
  rate_to_eur: number;
  updated_at: string;
};

const CODES: Currency[] = ["EUR", "USD", "CNY", "RUB", "UZS"];

export default async function CurrencySettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
    redirect("/admin");
  }

  const { data } = await supabase
    .from("currency_rates")
    .select("code, rate_to_eur, updated_at")
    .returns<RateRow[]>();

  const ratesMap = new Map<Currency, RateRow>();
  for (const r of data ?? []) ratesMap.set(r.code, r);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Курсы валют</h1>
        <p className="mt-2 text-muted-foreground">
          Базовая валюта — EUR. Поле «1 X = ? EUR» показывает, сколько евро вы получите за 1 единицу валюты.
        </p>
      </div>

      <Alert>
        <AlertDescription>
          <span className="font-medium">Пример:</span> для USD = 0.92 означает «1 USD = 0,92 EUR». Клиенты с валютой UZS будут видеть прайс с пересчётом по этим курсам.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Текущие курсы</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyRatesForm
            initial={CODES.map((code) => ({
              code,
              rate: ratesMap.get(code)?.rate_to_eur ?? 1,
              updatedAt: ratesMap.get(code)?.updated_at ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
