"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export type EditProductState = { ok?: boolean; error?: string };

export async function updateProductAction(
  _prev: EditProductState,
  formData: FormData,
): Promise<EditProductState> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "id missing" };

  const base_price = parseFloat(String(formData.get("base_price") ?? "0"));
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10);
  const lead_time = String(formData.get("lead_time") ?? "").trim() || null;
  const is_active = formData.get("is_active") === "on";

  if (!Number.isFinite(base_price) || base_price < 0) {
    return { error: "Цена должна быть числом >= 0" };
  }
  if (!Number.isFinite(stock) || stock < 0) {
    return { error: "Наличие должно быть >= 0" };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("products")
    .update({ base_price, stock, lead_time, is_active })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  return { ok: true };
}

export async function toggleActiveAction(productId: string, active: boolean) {
  await requireStaff();
  const admin = createSupabaseAdminClient();
  await admin.from("products").update({ is_active: active }).eq("id", productId);
  revalidatePath("/admin/products");
}
