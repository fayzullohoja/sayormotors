"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type VinSubmitState = {
  ok?: boolean;
  error?: string;
  values?: Record<string, string>;
};

export async function submitVinRequestAction(
  _prev: VinSubmitState,
  formData: FormData,
): Promise<VinSubmitState> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    values[k] = String(v ?? "").trim();
  }

  if (!values.vin) {
    return { error: "Укажите VIN", values };
  }
  if (!values.what_needed) {
    return { error: "Опишите, что нужно подобрать", values };
  }
  if (values.vin.length < 10 || values.vin.length > 20) {
    return { error: "VIN обычно 17 символов — проверьте ввод", values };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized", values };

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, company_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.status !== "active" || !profile.company_id) {
    return {
      error: "VIN-запрос доступен после одобрения аккаунта",
      values,
    };
  }

  const admin = createSupabaseAdminClient();
  const yearNum = values.year ? parseInt(values.year, 10) : NaN;

  const { error } = await admin.from("vin_requests").insert({
    company_id: profile.company_id,
    created_by: user.id,
    vin: values.vin.toUpperCase(),
    make: values.make || null,
    model: values.model || null,
    year: Number.isFinite(yearNum) ? yearNum : null,
    what_needed: values.what_needed,
    client_comment: values.client_comment || null,
    photo_urls: [],
    status: "new",
  });
  if (error) return { error: error.message, values };

  revalidatePath("/app/vin");
  revalidatePath("/admin/vin");
  return { ok: true };
}
