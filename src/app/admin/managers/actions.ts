"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole, UserStatus } from "@/lib/supabase/types";

async function requireAdmin() {
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
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
  return user.id;
}

export type InviteState = {
  ok?: boolean;
  error?: string;
  email?: string;
};

export async function inviteStaffAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "manager") as UserRole;

  if (!email || !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
    return { error: "Неверный email", email };
  }
  if (role !== "manager" && role !== "admin") {
    return { error: "Недопустимая роль", email };
  }

  const admin = createSupabaseAdminClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Use the Auth Admin REST API directly because supabase-js doesn't expose inviteUserByEmail in the typed surface for self-hosted-style data.
  const inviteRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/invite`,
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        data: { full_name: fullName || null },
        redirect_to: `${origin}/auth/callback?next=/admin`,
      }),
    },
  );
  if (!inviteRes.ok) {
    const txt = await inviteRes.text();
    return { error: `invite_failed: ${txt}`, email };
  }
  const invited = (await inviteRes.json()) as { id: string };

  // Promote the auto-created profile to the desired staff role.
  const status: UserStatus = "active";
  const { error: updErr } = await admin
    .from("profiles")
    .update({ role, status, full_name: fullName || null })
    .eq("id", invited.id);
  if (updErr) return { error: updErr.message, email };

  revalidatePath("/admin/managers");
  return { ok: true, email };
}

export async function setStaffStatusAction(
  userId: string,
  status: UserStatus,
) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({ status }).eq("id", userId);
  revalidatePath("/admin/managers");
}

export async function setStaffRoleAction(
  userId: string,
  role: UserRole,
) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/managers");
}

export async function removeStaffAction(userId: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  await admin.from("profiles").delete().eq("id", userId);
  // Best-effort: also delete the auth user
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: "DELETE",
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY!}`,
      },
    },
  );
  revalidatePath("/admin/managers");
}
