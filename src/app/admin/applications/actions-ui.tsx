"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  approveApplicationAction,
  rejectApplicationAction,
  type ApplicationActionState,
} from "./actions";

const initial: ApplicationActionState = {};

export function ApplicationActions({
  companyId,
  email,
}: {
  companyId: string;
  email: string | null;
}) {
  return (
    <div className="flex justify-end gap-2">
      <ApproveButton companyId={companyId} email={email} />
      <RejectButton companyId={companyId} />
    </div>
  );
}

function ApproveButton({
  companyId,
  email,
}: {
  companyId: string;
  email: string | null;
}) {
  const [state, formAction] = useActionState(approveApplicationAction, initial);

  // Surface errors / success via toast on each new state
  if (state.error) {
    toast.error(`Не удалось одобрить: ${state.error}`);
    state.error = undefined;
  }
  if (state.ok) {
    toast.success(`Приглашение отправлено на ${email}`);
    state.ok = undefined;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="company_id" value={companyId} />
      <ApproveSubmit />
    </form>
  );
}

function ApproveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Отправляем…" : "Одобрить"}
    </Button>
  );
}

function RejectButton({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(rejectApplicationAction, initial);

  if (state.error) {
    toast.error(state.error);
    state.error = undefined;
  }
  if (state.ok) {
    toast.success("Заявка отклонена");
    state.ok = undefined;
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Отклонить
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отклонить заявку</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="company_id" value={companyId} />
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Причина (внутренний комментарий)
            </label>
            <Textarea id="reason" name="reason" rows={3} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <RejectSubmit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Сохраняем…" : "Отклонить"}
    </Button>
  );
}
