"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Currency } from "@/lib/supabase/types";

async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
    throw new Error("forbidden");
  }
}

export type RateUpdateState = { ok?: boolean; error?: string };

export async function updateRatesAction(
  _prev: RateUpdateState,
  formData: FormData,
): Promise<RateUpdateState> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const codes: Currency[] = ["EUR", "USD", "CNY", "RUB", "UZS"];
  const admin = createSupabaseAdminClient();
  for (const code of codes) {
    const raw = String(formData.get(`rate_${code}`) ?? "").trim().replace(",", ".");
    const rate = parseFloat(raw);
    if (!Number.isFinite(rate) || rate <= 0) {
      return { error: `Курс для ${code} должен быть положительным числом` };
    }
    const { error } = await admin
      .from("currency_rates")
      .upsert({ code, rate_to_eur: rate });
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/settings/currency");
  return { ok: true };
}
