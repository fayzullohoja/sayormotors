"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { tgSendMessage, tgEscape, siteUrl } from "@/lib/telegram";
import { REQUEST_STATUS_LABEL } from "@/lib/request-status";
import type {
  RequestStatus,
  RequestItemStatus,
} from "@/lib/supabase/types";

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

export type SaveRequestInput = {
  requestId: string;
  status?: RequestStatus;
  manager_comment?: string;
  assign_to_me?: boolean;
  items: Array<{
    id: string;
    status: RequestItemStatus;
    qty_confirmed: number | null;
    price_confirmed: number | null;
    manager_comment: string | null;
  }>;
};

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveRequestUpdates(
  input: SaveRequestInput,
): Promise<SaveResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!input.requestId) return { ok: false, error: "requestId missing" };

  const admin = createSupabaseAdminClient();

  const { data: existingRequest } = await admin
    .from("requests")
    .select("status, manager_comment, total_amount, display_currency, assigned_manager_id")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!existingRequest) return { ok: false, error: "request_not_found" };

  // 1) Update items
  const itemHistory: Array<{
    item_id: string;
    changes: Record<string, unknown>;
  }> = [];

  for (const it of input.items) {
    const { data: existing } = await admin
      .from("request_items")
      .select(
        "id, status, qty_confirmed, price_confirmed, manager_comment, qty_requested, price_at_request, currency",
      )
      .eq("id", it.id)
      .maybeSingle();
    if (!existing) continue;

    const updates: Record<string, unknown> = {};
    const changes: Record<string, unknown> = {};

    if (it.status !== existing.status) {
      updates.status = it.status;
      changes.status = { from: existing.status, to: it.status };
    }
    if (
      (it.qty_confirmed ?? null) !==
      ((existing as { qty_confirmed: number | null }).qty_confirmed ?? null)
    ) {
      updates.qty_confirmed = it.qty_confirmed;
      changes.qty_confirmed = {
        from: (existing as { qty_confirmed: number | null }).qty_confirmed,
        to: it.qty_confirmed,
      };
    }
    if (
      (it.price_confirmed ?? null) !==
      ((existing as { price_confirmed: number | null }).price_confirmed ?? null)
    ) {
      updates.price_confirmed = it.price_confirmed;
      changes.price_confirmed = {
        from: (existing as { price_confirmed: number | null }).price_confirmed,
        to: it.price_confirmed,
      };
    }
    if (
      (it.manager_comment ?? null) !==
      ((existing as { manager_comment: string | null }).manager_comment ?? null)
    ) {
      updates.manager_comment = it.manager_comment;
      changes.manager_comment = {
        from: (existing as { manager_comment: string | null }).manager_comment,
        to: it.manager_comment,
      };
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await admin
        .from("request_items")
        .update(updates as never)
        .eq("id", it.id);
      if (error) return { ok: false, error: `item ${it.id}: ${error.message}` };
      itemHistory.push({ item_id: it.id, changes });
    }
  }

  // 2) Update request itself
  const requestUpdates: Record<string, unknown> = {};
  const requestChanges: Record<string, unknown> = {};

  if (input.assign_to_me) {
    requestUpdates.assigned_manager_id = userId;
    if (
      (existingRequest as { assigned_manager_id: string | null })
        .assigned_manager_id !== userId
    ) {
      requestChanges.assigned_manager_id = {
        from: (existingRequest as { assigned_manager_id: string | null })
          .assigned_manager_id,
        to: userId,
      };
    }
  }
  if (input.status && input.status !== existingRequest.status) {
    requestUpdates.status = input.status;
    requestChanges.status = { from: existingRequest.status, to: input.status };
    if (input.status === "confirmed") {
      requestUpdates.confirmed_at = new Date().toISOString();
    }
    if (input.status === "completed" || input.status === "cancelled") {
      requestUpdates.closed_at = new Date().toISOString();
    }
  }
  if (
    input.manager_comment !== undefined &&
    input.manager_comment !== existingRequest.manager_comment
  ) {
    requestUpdates.manager_comment = input.manager_comment || null;
    requestChanges.manager_comment = {
      from: existingRequest.manager_comment,
      to: input.manager_comment || null,
    };
  }

  // Recompute total based on confirmed/at-request prices and confirmed/requested qty
  const { data: itemsFresh } = await admin
    .from("request_items")
    .select(
      "qty_requested, qty_confirmed, price_at_request, price_confirmed, status",
    )
    .eq("request_id", input.requestId);
  if (itemsFresh) {
    let total = 0;
    for (const it of itemsFresh as Array<{
      qty_requested: number;
      qty_confirmed: number | null;
      price_at_request: number | null;
      price_confirmed: number | null;
      status: RequestItemStatus;
    }>) {
      if (it.status === "unavailable") continue;
      const qty = it.qty_confirmed ?? it.qty_requested;
      const price = it.price_confirmed ?? it.price_at_request ?? 0;
      total += qty * price;
    }
    if (total !== existingRequest.total_amount) {
      requestUpdates.total_amount = total;
    }
  }

  if (Object.keys(requestUpdates).length > 0) {
    const { error } = await admin
      .from("requests")
      .update(requestUpdates as never)
      .eq("id", input.requestId);
    if (error) return { ok: false, error: error.message };
  }

  // 3) Write a single history entry summarizing this save
  if (
    Object.keys(requestChanges).length > 0 ||
    itemHistory.length > 0
  ) {
    await admin.from("request_history").insert({
      request_id: input.requestId,
      changed_by: userId,
      event_type: "manager_update",
      payload: {
        request: requestChanges,
        items: itemHistory,
      } as never,
    });
  }

  // 4) Notify client via Telegram if linked
  const requestChangesTyped = requestChanges as { status?: { from: RequestStatus; to: RequestStatus } };
  if (input.status && requestChangesTyped.status) {
    try {
      const { data: req } = await admin
        .from("requests")
        .select("number, manager_comment, created_by")
        .eq("id", input.requestId)
        .maybeSingle();
      if (req?.created_by) {
        const { data: clientProfile } = await admin
          .from("profiles")
          .select("telegram_chat_id")
          .eq("id", req.created_by)
          .maybeSingle();
        const chatId = (clientProfile as { telegram_chat_id: number | null } | null)
          ?.telegram_chat_id;
        if (chatId) {
          const text = [
            `📦 <b>Заявка №${req.number ?? 0} · ${REQUEST_STATUS_LABEL[input.status]}</b>`,
            req.manager_comment ? `\n${tgEscape(req.manager_comment)}` : "",
            `\n<a href="${siteUrl()}/app/requests/${input.requestId}">Открыть заявку</a>`,
          ]
            .filter(Boolean)
            .join("\n");
          await tgSendMessage(chatId, text);
        }
      }
    } catch (e) {
      console.error("[notify] request status tg failed:", e);
    }
  }

  revalidatePath(`/admin/requests/${input.requestId}`);
  revalidatePath("/admin/requests");
  revalidatePath(`/app/requests/${input.requestId}`);
  return { ok: true };
}
