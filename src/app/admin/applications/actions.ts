"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ApplicationActionState = {
  ok?: boolean;
  error?: string;
};

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
    .maybeSingle<{ role: "client" | "manager" | "admin" }>();
  if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
    throw new Error("forbidden");
  }
  return { supabase, user, role: profile.role };
}

export async function approveApplicationAction(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const companyId = String(formData.get("company_id") ?? "");
  if (!companyId) return { error: "company_id missing" };

  const admin = createSupabaseAdminClient();

  // Read company first to grab application_email
  const { data: company, error: readErr } = await admin
    .from("companies")
    .select("id, name, application_email, application_status")
    .eq("id", companyId)
    .maybeSingle<{
      id: string;
      name: string;
      application_email: string | null;
      application_status: "pending" | "approved" | "rejected";
    }>();
  if (readErr || !company) {
    return { error: readErr?.message ?? "company_not_found" };
  }
  if (!company.application_email) {
    return { error: "application_email_missing" };
  }
  if (company.application_status === "approved") {
    return { error: "already_approved" };
  }

  // 1) Mark approved + active. Order matters: trigger handle_new_auth_user
  // links new profiles by email/status='approved'.
  const { error: updateErr } = await admin
    .from("companies")
    .update({ application_status: "approved", is_active: true })
    .eq("id", companyId);
  if (updateErr) return { error: updateErr.message };

  // 2) Invite user via Supabase Auth Admin API
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    company.application_email,
    {
      redirectTo: `${origin}/auth/callback?next=/app`,
      data: { company_name: company.name },
    },
  );
  if (inviteErr) {
    // Roll back: undo the company status change so admin can retry
    await admin
      .from("companies")
      .update({ application_status: "pending", is_active: false })
      .eq("id", companyId);
    return { error: `invite_failed: ${inviteErr.message}` };
  }

  revalidatePath("/admin/applications");
  return { ok: true };
}

export async function rejectApplicationAction(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const companyId = String(formData.get("company_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!companyId) return { error: "company_id missing" };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("companies")
    .update({
      application_status: "rejected",
      is_active: false,
      internal_comment: reason,
    })
    .eq("id", companyId);
  if (error) return { error: error.message };

  revalidatePath("/admin/applications");
  return { ok: true };
}
