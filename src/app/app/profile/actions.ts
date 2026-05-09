"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileState = {
  ok?: boolean;
  error?: string;
};

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const payload = {
    full_name: clean(formData.get("full_name")),
    phone: clean(formData.get("phone")),
    telegram: clean(formData.get("telegram")),
    whatsapp: clean(formData.get("whatsapp")),
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/profile");
  return { ok: true };
}

function clean(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length === 0 ? null : s;
}
