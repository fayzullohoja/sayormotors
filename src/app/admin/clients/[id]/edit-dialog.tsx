"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { updateClientAction, type UpdateClientState } from "./actions";

const initial: UpdateClientState = {};

type Company = {
  id: string;
  name: string;
  inn: string | null;
  contact_person: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  legal_address: string | null;
  pricing_group: string | null;
  discount_percent: number | null;
  default_currency: string | null;
  is_active: boolean;
  internal_comment: string | null;
};

export function EditClientDialog({
  company,
  isAdmin,
}: {
  company: Company;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateClientAction, initial);

  if (state.ok) {
    toast.success("Сохранено");
    state.ok = undefined;
    setOpen(false);
  }
  if (state.error) {
    toast.error(state.error);
    state.error = undefined;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Редактировать</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать клиента</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={company.id} />
          <Field id="name" label="Название" defaultValue={company.name} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="inn" label="ИНН" defaultValue={company.inn ?? ""} />
            <Field
              id="contact_person"
              label="Контактное лицо"
              defaultValue={company.contact_person ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="phone" label="Телефон" defaultValue={company.phone ?? ""} />
            <Field id="email" label="Email" defaultValue={company.email ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="telegram" label="Telegram" defaultValue={company.telegram ?? ""} />
            <Field id="whatsapp" label="WhatsApp" defaultValue={company.whatsapp ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="city" label="Город" defaultValue={company.city ?? ""} />
            <Field id="country" label="Страна" defaultValue={company.country ?? ""} />
          </div>
          <Field
            id="legal_address"
            label="Юридический адрес"
            defaultValue={company.legal_address ?? ""}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pricing_group">
                Группа цен{!isAdmin ? <span className="ml-1 text-xs text-muted-foreground">(admin)</span> : null}
              </Label>
              <Input
                id="pricing_group"
                name="pricing_group"
                defaultValue={company.pricing_group ?? "default"}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_percent">
                Скидка %{!isAdmin ? <span className="ml-1 text-xs text-muted-foreground">(admin)</span> : null}
              </Label>
              <Input
                id="discount_percent"
                name="discount_percent"
                type="number"
                step="0.5"
                min={0}
                max={100}
                defaultValue={company.discount_percent ?? 0}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_currency">Валюта</Label>
              <Select
                name="default_currency"
                defaultValue={company.default_currency ?? "EUR"}
              >
                <SelectTrigger id="default_currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                  <SelectItem value="RUB">RUB</SelectItem>
                  <SelectItem value="UZS">UZS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_comment">Внутренний комментарий</Label>
            <Textarea
              id="internal_comment"
              name="internal_comment"
              rows={2}
              defaultValue={company.internal_comment ?? ""}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={company.is_active}
              className="size-4"
            />
            Аккаунт активен (клиент видит цены и может оформлять заявки)
          </label>

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <SubmitBtn />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  defaultValue,
  required,
}: {
  id: string;
  label: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} defaultValue={defaultValue} required={required} />
    </div>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем…" : "Сохранить"}
    </Button>
  );
}
