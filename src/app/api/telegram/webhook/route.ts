import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { tgSendMessage, tgEscape, siteUrl } from "@/lib/telegram";

type TgUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string; username?: string; first_name?: string };
    from?: { id: number; username?: string; first_name?: string };
    text?: string;
  };
};

const SECRET_HEADER = "x-telegram-bot-api-secret-token";

function generateCode(): string {
  // 6-char alphanumeric, easy to type
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

export async function POST(request: NextRequest) {
  // Optional secret token check (set via Telegram setWebhook with secret_token)
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = request.headers.get(SECRET_HEADER);
    if (got !== expected) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const message = update.message;
  if (!message?.text || !message.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const text = message.text.trim();
  const chatId = message.chat.id;
  const username = message.chat.username ?? message.from?.username;
  const firstName = message.chat.first_name ?? message.from?.first_name;

  if (text === "/start" || text.startsWith("/start ")) {
    await handleStart(chatId, username, firstName);
    return NextResponse.json({ ok: true });
  }

  if (text === "/unlink") {
    await handleUnlink(chatId);
    return NextResponse.json({ ok: true });
  }

  if (text === "/help" || text === "/?") {
    await tgSendMessage(
      chatId,
      [
        "<b>Sayor Motors · Telegram-уведомления</b>",
        "",
        "/start — получить код для привязки кабинета",
        "/unlink — отвязать аккаунт",
        "/help — эта справка",
      ].join("\n"),
    );
    return NextResponse.json({ ok: true });
  }

  // Default fallback
  await tgSendMessage(
    chatId,
    [
      "Не понял команду. Доступно:",
      "",
      "/start — код для привязки",
      "/unlink — отвязать",
      "/help — справка",
    ].join("\n"),
  );
  return NextResponse.json({ ok: true });
}

async function handleStart(
  chatId: number,
  username: string | undefined,
  firstName: string | undefined,
) {
  const admin = createSupabaseAdminClient();

  // If already linked, tell user
  const { data: existing } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (existing) {
    await tgSendMessage(
      chatId,
      `✅ Аккаунт уже привязан${(existing as { full_name: string | null }).full_name ? ` (${tgEscape((existing as { full_name: string | null }).full_name!)})` : ""}.\nДля отвязки — /unlink.`,
    );
    return;
  }

  // Generate fresh one-time code
  const code = generateCode();
  await admin.from("telegram_link_codes").insert({
    code,
    telegram_chat_id: chatId,
    telegram_username: username ?? null,
    telegram_first_name: firstName ?? null,
  });

  await tgSendMessage(
    chatId,
    [
      `Привет${firstName ? `, ${tgEscape(firstName)}` : ""}!`,
      "",
      `Чтобы получать уведомления о заявках, привяжите ваш B2B-кабинет.`,
      "",
      `Код для привязки:`,
      `<code>${code}</code>`,
      "",
      `Откройте <a href="${siteUrl()}/app/profile">Профиль</a> и вставьте код в раздел «Привязка Telegram».`,
      "",
      `Код действует 30 минут.`,
    ].join("\n"),
  );
}

async function handleUnlink(chatId: number) {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (!profile) {
    await tgSendMessage(chatId, "Этот чат не привязан к кабинету.");
    return;
  }
  await admin
    .from("profiles")
    .update({ telegram_chat_id: null })
    .eq("id", (profile as { id: string }).id);
  await tgSendMessage(
    chatId,
    "✅ Аккаунт отвязан. Уведомления больше не будут приходить.",
  );
}

// Telegram occasionally GETs the webhook URL during setup; respond OK.
export async function GET() {
  return NextResponse.json({ ok: true, service: "sayormotors-tg-webhook" });
}
