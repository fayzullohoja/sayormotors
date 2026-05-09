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
  return { userId: user.id, role: profile.role };
}

export type UpdateClientState = { ok?: boolean; error?: string };

export async function updateClientAction(
  _prev: UpdateClientState,
  formData: FormData,
): Promise<UpdateClientState> {
  let role: "manager" | "admin";
  try {
    ({ role } = await requireStaff());
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "id missing" };

  const discountStr = String(formData.get("discount_percent") ?? "0");
  const discount = parseFloat(discountStr.replace(",", "."));
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    return { error: "Скидка должна быть числом от 0 до 100" };
  }

  const updates: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim() || undefined,
    inn: stringOrNull(formData.get("inn")),
    contact_person: stringOrNull(formData.get("contact_person")),
    phone: stringOrNull(formData.get("phone")),
    telegram: stringOrNull(formData.get("telegram")),
    whatsapp: stringOrNull(formData.get("whatsapp")),
    email: stringOrNull(formData.get("email")),
    city: stringOrNull(formData.get("city")),
    country: stringOrNull(formData.get("country")),
    legal_address: stringOrNull(formData.get("legal_address")),
    pricing_group: stringOrNull(formData.get("pricing_group")) ?? "default",
    discount_percent: discount,
    default_currency: (String(formData.get("default_currency") ?? "EUR") as Currency),
    is_active: formData.get("is_active") === "on",
    internal_comment: stringOrNull(formData.get("internal_comment")),
  };

  // Drop undefined keys (e.g. name not changed)
  for (const k of Object.keys(updates)) {
    if (updates[k] === undefined) delete updates[k];
  }

  // Only admin can change pricing_group + discount_percent (commercial decisions)
  if (role !== "admin") {
    delete updates.pricing_group;
    delete updates.discount_percent;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("companies")
    .update(updates as never)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin/clients");
  return { ok: true };
}

function stringOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length === 0 ? null : s;
}
