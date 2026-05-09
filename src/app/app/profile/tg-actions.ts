"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { tgSendMessage } from "@/lib/telegram";

export type LinkResult = { ok: boolean; error?: string; message?: string };

const CODE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function linkTelegramAction(
  _prev: LinkResult | null,
  formData: FormData,
): Promise<LinkResult> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code || code.length !== 6) {
    return { ok: false, error: "Код должен быть 6 символов" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const admin = createSupabaseAdminClient();
  const { data: link } = await admin
    .from("telegram_link_codes")
    .select(
      "code, telegram_chat_id, telegram_username, telegram_first_name, created_at, consumed_at",
    )
    .eq("code", code)
    .maybeSingle();

  if (!link) return { ok: false, error: "Код не найден. Сгенерируйте новый через /start у бота." };
  const linkRow = link as {
    code: string;
    telegram_chat_id: number;
    telegram_username: string | null;
    telegram_first_name: string | null;
    created_at: string;
    consumed_at: string | null;
  };
  if (linkRow.consumed_at) {
    return { ok: false, error: "Этот код уже использован." };
  }
  if (Date.now() - new Date(linkRow.created_at).getTime() > CODE_TTL_MS) {
    return { ok: false, error: "Код истёк (живёт 30 минут). Сгенерируйте новый." };
  }

  // Make sure no other profile uses the same chat_id
  const { error: clearErr } = await admin
    .from("profiles")
    .update({ telegram_chat_id: null })
    .eq("telegram_chat_id", linkRow.telegram_chat_id);
  if (clearErr) return { ok: false, error: clearErr.message };

  const { error: linkErr } = await admin
    .from("profiles")
    .update({ telegram_chat_id: linkRow.telegram_chat_id })
    .eq("id", user.id);
  if (linkErr) return { ok: false, error: linkErr.message };

  await admin
    .from("telegram_link_codes")
    .update({ consumed_at: new Date().toISOString(), consumed_by: user.id })
    .eq("code", code);

  await tgSendMessage(
    linkRow.telegram_chat_id,
    "✅ Telegram привязан к вашему B2B-кабинету. Теперь сюда будут приходить уведомления о заявках.",
  );

  revalidatePath("/app/profile");
  return { ok: true, message: "Готово — Telegram привязан." };
}

export async function unlinkTelegramAction(): Promise<LinkResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("telegram_chat_id")
    .eq("id", user.id)
    .maybeSingle();
  const chatId = (profile as { telegram_chat_id: number | null } | null)
    ?.telegram_chat_id;

  await admin
    .from("profiles")
    .update({ telegram_chat_id: null })
    .eq("id", user.id);

  if (chatId) {
    await tgSendMessage(
      chatId,
      "Telegram отвязан от B2B-кабинета. Уведомления больше не будут приходить.",
    );
  }

  revalidatePath("/app/profile");
  return { ok: true };
}
