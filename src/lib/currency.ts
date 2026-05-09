import { createSupabaseServerClient } from "./supabase/server";
import type { Currency } from "./supabase/types";

export type CurrencyRates = Map<Currency, number>;

/**
 * Fetch currency rates relative to EUR (base = EUR).
 * `rate_to_eur` for code X means: 1 unit of X = N EUR.
 * If a rate is missing, defaults to 1 (treat as EUR-equivalent).
 */
export async function getCurrencyRates(): Promise<CurrencyRates> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("currency_rates")
    .select("code, rate_to_eur");
  const map = new Map<Currency, number>();
  for (const row of data ?? []) {
    const code = (row as { code: Currency }).code;
    const rate = Number((row as { rate_to_eur: number }).rate_to_eur);
    if (Number.isFinite(rate) && rate > 0) {
      map.set(code, rate);
    }
  }
  if (!map.has("EUR")) map.set("EUR", 1);
  return map;
}

/**
 * Convert amount from `from` currency to `to` currency using rates relative to EUR.
 * Returns null if either rate is missing.
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: CurrencyRates,
): number | null {
  if (from === to) return amount;
  const rateFrom = rates.get(from);
  const rateTo = rates.get(to);
  if (!rateFrom || !rateTo) return null;
  // amount in EUR = amount * rateFrom
  // amount in target = (amount * rateFrom) / rateTo
  const inEur = amount * rateFrom;
  const inTarget = inEur / rateTo;
  return roundForCurrency(inTarget, to);
}

function roundForCurrency(value: number, code: Currency): number {
  // UZS has no fractional units in practice
  if (code === "UZS") return Math.round(value);
  return Math.round(value * 100) / 100;
}

export function formatConverted(amount: number, code: Currency): string {
  const formatted = amount.toLocaleString("ru-RU", {
    minimumFractionDigits: code === "UZS" ? 0 : 2,
    maximumFractionDigits: code === "UZS" ? 0 : 2,
  });
  return `${formatted} ${code}`;
}
