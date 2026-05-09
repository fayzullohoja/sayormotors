"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateProfileAction, type ProfileState } from "./actions";

const initial: ProfileState = {};

export function ProfileForm({
  email,
  defaults,
}: {
  email: string;
  defaults: { full_name: string; phone: string; telegram: string; whatsapp: string };
}) {
  const [state, formAction] = useActionState(updateProfileAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-readonly">Email</Label>
        <Input id="email-readonly" value={email} disabled />
        <p className="text-xs text-muted-foreground">
          Email — менять нельзя. Если изменился — свяжитесь с менеджером.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="full_name">ФИО</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaults.full_name}
          placeholder="Иван Иванов"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaults.phone}
            placeholder="+998 90 123 45 67"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            defaultValue={defaults.whatsapp}
            placeholder="+998…"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="telegram">Telegram</Label>
        <Input
          id="telegram"
          name="telegram"
          defaultValue={defaults.telegram}
          placeholder="@username"
        />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert>
          <AlertDescription>Сохранено</AlertDescription>
        </Alert>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем…" : "Сохранить"}
    </Button>
  );
}
