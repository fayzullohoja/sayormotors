"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { tgSendMessage, tgNotifyManagers, tgEscape, siteUrl } from "@/lib/telegram";
import type { VinRequestStatus } from "@/lib/supabase/types";

const VIN_STATUS_LABEL: Record<VinRequestStatus, string> = {
  new: "Новый",
  in_progress: "В обработке",
  quoted: "Подобрано",
  rejected: "Отклонён",
  completed: "Завершён",
};

export type VinSubmitState = {
  ok?: boolean;
  error?: string;
  values?: Record<string, string>;
};

const MAX_PHOTOS = 5;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function submitVinRequestAction(
  _prev: VinSubmitState,
  formData: FormData,
): Promise<VinSubmitState> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (!(v instanceof File)) values[k] = String(v ?? "").trim();
  }

  if (!values.vin) return { error: "Укажите VIN", values };
  if (!values.what_needed)
    return { error: "Опишите, что нужно подобрать", values };
  if (values.vin.length < 10 || values.vin.length > 20)
    return { error: "VIN обычно 17 символов — проверьте ввод", values };

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

  const photos: File[] = [];
  for (const file of formData.getAll("photos")) {
    if (!(file instanceof File)) continue;
    if (file.size === 0) continue;
    if (!ALLOWED_MIME.has(file.type)) {
      return { error: `Формат ${file.type} не поддерживается`, values };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { error: "Каждое фото должно быть не больше 10 МБ", values };
    }
    photos.push(file);
    if (photos.length >= MAX_PHOTOS) break;
  }

  const admin = createSupabaseAdminClient();
  const yearNum = values.year ? parseInt(values.year, 10) : NaN;

  const { data: inserted, error: insertErr } = await admin
    .from("vin_requests")
    .insert({
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
    })
    .select("id")
    .single<{ id: string }>();
  if (insertErr || !inserted) {
    return { error: insertErr?.message ?? "insert_failed", values };
  }

  const photoPaths: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    const ext = pickExt(file);
    const path = `${inserted.id}/${Date.now()}-${i}${ext}`;
    const { error: upErr } = await admin.storage
      .from("vin-photos")
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
    if (upErr) {
      // Roll back the row to avoid orphan with partial photos
      await admin.from("vin_requests").delete().eq("id", inserted.id);
      return { error: `photo_upload_failed: ${upErr.message}`, values };
    }
    photoPaths.push(path);
  }

  if (photoPaths.length > 0) {
    await admin
      .from("vin_requests")
      .update({ photo_urls: photoPaths })
      .eq("id", inserted.id);
  }

  // Notify managers about new VIN request
  const { data: company } = await admin
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .maybeSingle();
  const companyName = (company as { name: string } | null)?.name ?? "—";
  await tgNotifyManagers(
    [
      `🔧 <b>Новый VIN-запрос</b>`,
      `Компания: <b>${tgEscape(companyName)}</b>`,
      `VIN: <code>${tgEscape(values.vin.toUpperCase())}</code>`,
      [values.make, values.model, values.year]
        .filter(Boolean)
        .map((s) => tgEscape(String(s)))
        .join(" "),
      `\n${tgEscape(values.what_needed)}`,
      photoPaths.length > 0 ? `\n📷 Фото: ${photoPaths.length}` : "",
      `\n<a href="${siteUrl()}/admin/vin/${inserted.id}">Открыть в админке</a>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  revalidatePath("/app/vin");
  revalidatePath("/admin/vin");
  return { ok: true };
}

function pickExt(file: File): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
  };
  return map[file.type] ?? "";
}

export type VinAdminUpdateState = { ok?: boolean; error?: string };

export async function updateVinRequestAdminAction(
  _prev: VinAdminUpdateState,
  formData: FormData,
): Promise<VinAdminUpdateState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!prof || (prof.role !== "manager" && prof.role !== "admin")) {
    return { error: "forbidden" };
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as VinRequestStatus;
  const managerComment = String(formData.get("manager_comment") ?? "").trim();
  const assignToMe = formData.get("assign_to_me") === "on";
  if (!id) return { error: "id_missing" };

  const admin = createSupabaseAdminClient();

  // Read prior state to detect status change
  const { data: prior } = await admin
    .from("vin_requests")
    .select("status, number, created_by")
    .eq("id", id)
    .maybeSingle();

  const updates: Record<string, unknown> = {
    status,
    manager_comment: managerComment || null,
  };
  if (assignToMe) updates.assigned_manager_id = user.id;
  const { error } = await admin
    .from("vin_requests")
    .update(updates as never)
    .eq("id", id);
  if (error) return { error: error.message };

  // Notify client via Telegram if linked, plus log to managers chat
  if (prior && prior.status !== status && prior.created_by) {
    try {
      const { data: clientProfile } = await admin
        .from("profiles")
        .select("telegram_chat_id")
        .eq("id", prior.created_by)
        .maybeSingle();
      const chatId = (clientProfile as { telegram_chat_id: number | null } | null)
        ?.telegram_chat_id;
      const text = [
        `🔧 <b>VIN-запрос №${prior.number} · ${VIN_STATUS_LABEL[status]}</b>`,
        managerComment ? `\n${tgEscape(managerComment)}` : "",
        `\n<a href="${siteUrl()}/app/vin">Открыть запрос</a>`,
      ]
        .filter(Boolean)
        .join("\n");
      if (chatId) await tgSendMessage(chatId, text);
    } catch (e) {
      console.error("[notify] vin status tg failed:", e);
    }
  }

  revalidatePath(`/admin/vin/${id}`);
  revalidatePath("/admin/vin");
  return { ok: true };
}
