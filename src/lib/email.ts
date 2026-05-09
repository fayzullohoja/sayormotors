/**
 * Email-sending helper. Uses Resend if RESEND_API_KEY is set; otherwise no-ops with a console log.
 *
 * Set RESEND_API_KEY and EMAIL_FROM env vars in production to enable sending.
 * EMAIL_FROM should be a verified sender like "Sayor Motors <noreply@sayormotors.com>".
 */

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Sayor Motors <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[email:noop] would send to=${input.to} subject="${input.subject}" (RESEND_API_KEY not set)`,
    );
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[email:resend] failed: ${res.status} ${txt}`);
    }
  } catch (e) {
    console.error("[email:resend] threw:", e);
  }
}

export function renderRequestStatusEmail(input: {
  number: number;
  newStatus: string;
  statusLabel: string;
  managerComment: string | null;
  url: string;
}): { subject: string; html: string; text: string } {
  const subject = `Заявка №${input.number} · ${input.statusLabel}`;
  const text = [
    `Статус вашей заявки №${input.number} обновлён: ${input.statusLabel}.`,
    input.managerComment ? `Комментарий менеджера: ${input.managerComment}` : "",
    `Открыть заявку: ${input.url}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const html = `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height:1.5; color:#0f172a;">
<div style="max-width:560px;margin:32px auto;padding:0 16px;">
  <h2 style="margin:0 0 16px;">Заявка №${input.number}</h2>
  <p style="margin:0 0 12px;">Статус обновлён: <b>${escapeHtml(input.statusLabel)}</b>.</p>
  ${
    input.managerComment
      ? `<p style="margin:12px 0;border-left:3px solid #1e3a8a;padding-left:12px;color:#475569;">${escapeHtml(input.managerComment)}</p>`
      : ""
  }
  <p style="margin:16px 0;"><a href="${input.url}" style="background:#1e3a8a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;">Открыть заявку</a></p>
  <p style="margin:24px 0 0;color:#64748b;font-size:12px;">Sayor Motors · B2B-платформа</p>
</div>
</body></html>`;
  return { subject, html, text };
}

export function renderVinStatusEmail(input: {
  number: number;
  newStatus: string;
  statusLabel: string;
  managerComment: string | null;
  url: string;
}): { subject: string; html: string; text: string } {
  const subject = `VIN-запрос №${input.number} · ${input.statusLabel}`;
  const text = [
    `Статус вашего VIN-запроса №${input.number} обновлён: ${input.statusLabel}.`,
    input.managerComment ? `Комментарий менеджера: ${input.managerComment}` : "",
    `Открыть запрос: ${input.url}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const html = `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height:1.5; color:#0f172a;">
<div style="max-width:560px;margin:32px auto;padding:0 16px;">
  <h2 style="margin:0 0 16px;">VIN-запрос №${input.number}</h2>
  <p style="margin:0 0 12px;">Статус обновлён: <b>${escapeHtml(input.statusLabel)}</b>.</p>
  ${
    input.managerComment
      ? `<p style="margin:12px 0;border-left:3px solid #1e3a8a;padding-left:12px;color:#475569;">${escapeHtml(input.managerComment)}</p>`
      : ""
  }
  <p style="margin:16px 0;"><a href="${input.url}" style="background:#1e3a8a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;">Открыть запрос</a></p>
  <p style="margin:24px 0 0;color:#64748b;font-size:12px;">Sayor Motors · B2B-платформа</p>
</div>
</body></html>`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
