"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateRatesAction, type RateUpdateState } from "./actions";
import type { Currency } from "@/lib/supabase/types";

const initial: RateUpdateState = {};

export function CurrencyRatesForm({
  initial: rates,
}: {
  initial: Array<{ code: Currency; rate: number; updatedAt: string | null }>;
}) {
  const [state, formAction] = useActionState(updateRatesAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {rates.map((r) => (
          <div
            key={r.code}
            className="flex items-end gap-3 rounded-md border p-3"
          >
            <div className="w-12 text-center">
              <div className="text-xs uppercase text-muted-foreground">
                Валюта
              </div>
              <div className="font-mono text-lg font-semibold">{r.code}</div>
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor={`rate_${r.code}`}>1 {r.code} = ? EUR</Label>
              <Input
                id={`rate_${r.code}`}
                name={`rate_${r.code}`}
                type="number"
                step="0.000001"
                min={0.0000001}
                defaultValue={r.rate}
                disabled={r.code === "EUR"}
                required
              />
              {r.updatedAt ? (
                <p className="text-xs text-muted-foreground">
                  Обновлено: {new Date(r.updatedAt).toLocaleString("ru")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert>
          <AlertDescription>Курсы обновлены</AlertDescription>
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
      {pending ? "Сохраняем…" : "Сохранить курсы"}
    </Button>
  );
}
