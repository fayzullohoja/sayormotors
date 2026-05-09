"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerAction, type RegisterState } from "./actions";

const initial: RegisterState = {};

const CLIENT_TYPES = [
  { value: "sto", label: "СТО / автосервис" },
  { value: "shop", label: "Магазин запчастей" },
  { value: "wholesale", label: "Оптовик" },
  { value: "dealer", label: "Дилер" },
  { value: "other", label: "Другое" },
];

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initial);
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </div>
        <h2 className="text-xl font-semibold">Заявка отправлена</h2>
        <p className="text-muted-foreground">
          Менеджер проверит данные и пришлёт письмо с доступом в кабинет на указанный
          email. Обычно — в течение рабочего дня.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Field
        id="company_name"
        label="Название компании"
        required
        defaultValue={v.company_name}
        placeholder="ООО Автозапчасти"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="inn"
          label="ИНН"
          defaultValue={v.inn}
          placeholder="123456789"
        />
        <div className="space-y-2">
          <Label htmlFor="client_type">Тип компании</Label>
          <Select name="client_type" defaultValue={v.client_type ?? "sto"}>
            <SelectTrigger id="client_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="country" label="Страна" defaultValue={v.country} placeholder="Узбекистан" />
        <Field id="city" label="Город" defaultValue={v.city} placeholder="Ташкент" />
      </div>
      <Field
        id="contact_person"
        label="Контактное лицо"
        required
        defaultValue={v.contact_person}
        placeholder="Иван Иванов"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="phone"
          label="Телефон"
          required
          defaultValue={v.phone}
          placeholder="+998 90 123 45 67"
          type="tel"
        />
        <Field
          id="email"
          label="Email"
          required
          defaultValue={v.email}
          placeholder="you@company.com"
          type="email"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="telegram" label="Telegram" defaultValue={v.telegram} placeholder="@username" />
        <Field id="whatsapp" label="WhatsApp" defaultValue={v.whatsapp} placeholder="+998…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          defaultValue={v.comment}
          placeholder="Что вас интересует, какой объём, особые условия"
        />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <SubmitButton />
      <p className="text-xs text-muted-foreground">
        Отправляя заявку, вы соглашаетесь на обработку контактных данных для целей
        связи и оформления B2B-доступа.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  type = "text",
  defaultValue,
  placeholder,
}: {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Отправляем…" : "Отправить заявку"}
    </Button>
  );
}
