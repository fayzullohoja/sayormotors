"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { inviteStaffAction, type InviteState } from "./actions";

const initial: InviteState = {};

export function InviteStaffForm() {
  const [state, formAction] = useActionState(inviteStaffAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="manager@sayormotors.com"
            defaultValue={state.email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="full_name">ФИО</Label>
          <Input id="full_name" name="full_name" placeholder="Имя Фамилия" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Роль</Label>
          <Select name="role" defaultValue="manager">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Менеджер</SelectItem>
              <SelectItem value="admin">Администратор</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert>
          <AlertDescription>
            Приглашение отправлено на {state.email}
          </AlertDescription>
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
      {pending ? "Отправляем…" : "Отправить приглашение"}
    </Button>
  );
}
