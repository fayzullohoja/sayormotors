"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { linkTelegramAction, unlinkTelegramAction } from "./tg-actions";

export function TelegramLink({
  linked,
  username,
  botUsername,
}: {
  linked: boolean;
  username: string | null;
  botUsername: string | null;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (linked) {
    return (
      <div className="space-y-3 text-sm">
        <Alert>
          <AlertDescription>
            ✅ Telegram привязан{username ? `: @${username}` : ""}. Уведомления о
            заявках приходят в чат.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const res = await unlinkTelegramAction();
              if (!res.ok) toast.error(res.error ?? "Ошибка");
              else toast.success("Telegram отвязан");
            });
          }}
        >
          {isPending ? "Отвязываем…" : "Отвязать Telegram"}
        </Button>
      </div>
    );
  }

  const botLink = botUsername ? `https://t.me/${botUsername}` : null;

  return (
    <form
      action={(formData: FormData) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const res = await linkTelegramAction(null, formData);
          if (!res.ok) setError(res.error ?? "Ошибка");
          else {
            setSuccess(res.message ?? "Готово");
            setCode("");
          }
        });
      }}
      className="space-y-3"
    >
      <p className="text-sm text-muted-foreground">
        {botLink ? (
          <>
            Откройте бота{" "}
            <a
              href={botLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              @{botUsername}
            </a>{" "}
            и отправьте /start. Бот пришлёт код — вставьте его сюда.
          </>
        ) : (
          <>Откройте Telegram-бота и отправьте /start. Бот пришлёт код — вставьте его сюда.</>
        )}
      </p>
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="tg_code">Код из бота</Label>
          <Input
            id="tg_code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
            placeholder="ABCXYZ"
            className="font-mono"
            maxLength={6}
            required
          />
        </div>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
      <SubmitBtn />
    </form>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Привязываем…" : "Привязать Telegram"}
    </Button>
  );
}
