"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import {
  updateVinRequestAdminAction,
  type VinAdminUpdateState,
} from "@/app/app/vin/actions";
import type { VinRequestStatus } from "@/lib/supabase/types";

const initial: VinAdminUpdateState = {};

const STATUSES: VinRequestStatus[] = [
  "new",
  "in_progress",
  "quoted",
  "rejected",
  "completed",
];

const STATUS_LABEL: Record<VinRequestStatus, string> = {
  new: "Новый",
  in_progress: "В обработке",
  quoted: "Подобрано",
  rejected: "Отклонён",
  completed: "Завершён",
};

export function VinManageForm({
  id,
  status: initialStatus,
  managerComment: initialComment,
  assigned,
}: {
  id: string;
  status: VinRequestStatus;
  managerComment: string;
  assigned: boolean;
}) {
  const [state, formAction] = useActionState(
    updateVinRequestAdminAction,
    initial,
  );
  const [status, setStatus] = useState<VinRequestStatus>(initialStatus);
  const [comment, setComment] = useState(initialComment);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <div className="space-y-2">
          <Label>Статус</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as VinRequestStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!assigned ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="assign_to_me"
                className="size-4"
              />
              Закрепить запрос за мной
            </label>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="manager_comment">Комментарий менеджера</Label>
          <Textarea
            id="manager_comment"
            name="manager_comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Опишите подбор, сроки, аналоги или причину отказа"
          />
        </div>
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
