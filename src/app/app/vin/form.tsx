"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitVinRequestAction, type VinSubmitState } from "./actions";

const initial: VinSubmitState = {};

export function VinForm({ canSubmit }: { canSubmit: boolean }) {
  const [state, formAction] = useActionState(submitVinRequestAction, initial);
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </div>
        <h3 className="text-lg font-semibold">VIN-запрос отправлен</h3>
        <p className="text-sm text-muted-foreground">
          Менеджер подберёт запчасти и свяжется с вами.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vin">VIN автомобиля</Label>
        <Input
          id="vin"
          name="vin"
          defaultValue={v.vin}
          placeholder="WBAVA31050NJ12345"
          className="font-mono uppercase"
          required
          autoFocus
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="make">Марка</Label>
          <Input id="make" name="make" defaultValue={v.make} placeholder="BMW" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Модель</Label>
          <Input id="model" name="model" defaultValue={v.model} placeholder="X5" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Год</Label>
          <Input
            id="year"
            name="year"
            type="number"
            min={1980}
            max={2099}
            defaultValue={v.year}
            placeholder="2018"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="what_needed">Что нужно подобрать</Label>
        <Textarea
          id="what_needed"
          name="what_needed"
          rows={3}
          defaultValue={v.what_needed}
          placeholder="Передние тормозные диски и колодки. Оригинал предпочтительнее, готов рассмотреть аналоги."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_comment">Дополнительный комментарий</Label>
        <Textarea
          id="client_comment"
          name="client_comment"
          rows={2}
          defaultValue={v.client_comment}
          placeholder="Сроки, бюджет, особые условия"
        />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {!canSubmit ? (
        <Alert>
          <AlertDescription>
            Отправка VIN-запросов открывается после одобрения аккаунта.
          </AlertDescription>
        </Alert>
      ) : null}
      <SubmitButton disabled={!canSubmit} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending || disabled}>
      {pending ? "Отправляем…" : "Отправить запрос"}
    </Button>
  );
}
