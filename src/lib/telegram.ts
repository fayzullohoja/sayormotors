/**
 * Telegram Bot helpers — used for staff alerts and per-client status updates.
 * Configure TELEGRAM_BOT_TOKEN (from @BotFather) and TELEGRAM_MANAGERS_CHAT_ID
 * (numeric ID of the manager group/channel where alerts go).
 */

const API_BASE = "https://api.telegram.org";

type TgSendOptions = {
  parse_mode?: "HTML" | "MarkdownV2";
  disable_web_page_preview?: boolean;
  reply_markup?: unknown;
};

async function tgFetch<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log(`[tg:noop] would call ${method} (TELEGRAM_BOT_TOKEN missing)`);
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!data.ok) {
      console.error(`[tg:${method}] failed:`, data.description);
      return null;
    }
    return data.result ?? null;
  } catch (e) {
    console.error(`[tg:${method}] threw:`, e);
    return null;
  }
}

export async function tgSendMessage(
  chatId: number | string,
  text: string,
  options?: TgSendOptions,
): Promise<boolean> {
  const result = await tgFetch("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode ?? "HTML",
    disable_web_page_preview: options?.disable_web_page_preview ?? true,
    reply_markup: options?.reply_markup,
  });
  return result !== null;
}

export async function tgNotifyManagers(text: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_MANAGERS_CHAT_ID;
  if (!chatId) {
    console.log(`[tg:noop] managers chat id missing`);
    return false;
  }
  return tgSendMessage(chatId, text);
}

export function tgEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function tgLink(text: string, url: string): string {
  return `<a href="${url}">${tgEscape(text)}</a>`;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://sayormotors.vercel.app";
}
