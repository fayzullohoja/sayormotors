"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  setStaffRoleAction,
  setStaffStatusAction,
  removeStaffAction,
} from "./actions";
import type { UserRole, UserStatus } from "@/lib/supabase/types";

export function StaffRowActions({
  userId,
  role,
  status,
}: {
  userId: string;
  role: UserRole;
  status: UserStatus;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>, msg: string) =>
    startTransition(async () => {
      try {
        await fn();
        toast.success(msg);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={isPending}>
            {isPending ? "…" : "Действия"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status !== "blocked" ? (
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => setStaffStatusAction(userId, "blocked"),
                  "Заблокирован",
                )
              }
            >
              Заблокировать
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => setStaffStatusAction(userId, "active"),
                  "Разблокирован",
                )
              }
            >
              Разблокировать
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {role === "manager" ? (
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => setStaffRoleAction(userId, "admin"),
                  "Назначен администратором",
                )
              }
            >
              Сделать администратором
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => setStaffRoleAction(userId, "manager"),
                  "Понижен до менеджера",
                )
              }
            >
              Понизить до менеджера
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setConfirmRemove(true)}
          >
            Удалить аккаунт
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить сотрудника?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Аккаунт будет удалён вместе с auth-сессией. История заявок останется
            (поле «менеджер» в них станет пустым).
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmRemove(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                run(async () => {
                  await removeStaffAction(userId);
                  setConfirmRemove(false);
                }, "Удалён")
              }
              disabled={isPending}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
