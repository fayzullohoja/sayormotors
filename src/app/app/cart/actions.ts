"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { tgNotifyManagers, tgEscape, siteUrl } from "@/lib/telegram";
import { formatPrice } from "@/lib/pricing";
import type { Currency } from "@/lib/supabase/types";

export type SubmitRequestInput = {
  items: Array<{
    product_id: string;
    article: string;
    name: string;
    brand: string | null;
    qty: number;
    price: number;
    currency: string;
  }>;
  contact_method: string;
  client_comment: string;
};

export type SubmitResult =
  | { ok: true; requestId: string; number: number }
  | { ok: false; error: string };

export async function submitRequestAction(
  input: SubmitRequestInput,
): Promise<SubmitResult> {
  if (!input.items || input.items.length === 0) {
    return { ok: false, error: "Корзина пуста" };
  }
  for (const it of input.items) {
    if (!it.product_id || !it.article || !Number.isFinite(it.qty) || it.qty < 1) {
      return { ok: false, error: "Некорректные позиции в корзине" };
    }
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, company_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.status !== "active" || !profile.company_id) {
    return {
      ok: false,
      error: "Доступ к оформлению заявок открывается после одобрения аккаунта",
    };
  }

  // Pick a display currency: most-used among items
  const currencyTally = new Map<string, number>();
  for (const it of input.items) {
    currencyTally.set(it.currency, (currencyTally.get(it.currency) ?? 0) + 1);
  }
  const displayCurrency = (
    Array.from(currencyTally.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "EUR"
  ) as Currency;

  const totalAmount = input.items.reduce(
    (sum, it) => sum + it.qty * it.price,
    0,
  );

  // Use admin client to bypass RLS for write (we already authorized above).
  // RLS would also allow it but admin avoids edge cases with RPC chaining.
  const admin = createSupabaseAdminClient();

  const { data: requestRow, error: requestErr } = await admin
    .from("requests")
    .insert({
      company_id: profile.company_id,
      created_by: user.id,
      status: "new",
      display_currency: displayCurrency,
      total_amount: totalAmount,
      contact_method: input.contact_method || null,
      client_comment: input.client_comment || null,
    })
    .select("id, number")
    .single<{ id: string; number: number }>();
  if (requestErr || !requestRow) {
    return { ok: false, error: requestErr?.message ?? "request_create_failed" };
  }

  const items = input.items.map((it) => ({
    request_id: requestRow.id,
    product_id: it.product_id,
    article_input: it.article,
    name_snapshot: it.name,
    brand_snapshot: it.brand,
    qty_requested: it.qty,
    price_at_request: it.price,
    currency: it.currency as Currency,
    status: "pending" as const,
  }));

  const { error: itemsErr } = await admin.from("request_items").insert(items);
  if (itemsErr) {
    await admin.from("requests").delete().eq("id", requestRow.id);
    return { ok: false, error: itemsErr.message };
  }

  // Audit log entry
  await admin.from("request_history").insert({
    request_id: requestRow.id,
    changed_by: user.id,
    event_type: "created",
    payload: {
      item_count: items.length,
      total_amount: totalAmount,
      currency: displayCurrency,
    },
  });

  // Notify managers about new request
  const { data: company } = await admin
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .maybeSingle();
  const companyName = (company as { name: string } | null)?.name ?? "—";
  await tgNotifyManagers(
    [
      `📦 <b>Новая заявка №${requestRow.number}</b>`,
      `Компания: <b>${tgEscape(companyName)}</b>`,
      `Позиций: ${items.length} · Сумма: ${formatPrice(totalAmount, displayCurrency)}`,
      input.contact_method ? `Связь: ${tgEscape(input.contact_method)}` : "",
      input.client_comment ? `\n${tgEscape(input.client_comment)}` : "",
      `\n<a href="${siteUrl()}/admin/requests/${requestRow.id}">Открыть в админке</a>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  revalidatePath("/app");
  revalidatePath("/app/requests");
  revalidatePath("/admin/requests");

  return { ok: true, requestId: requestRow.id, number: requestRow.number };
}
