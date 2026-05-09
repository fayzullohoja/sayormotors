import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InviteStaffForm } from "./invite-form";
import { StaffRowActions } from "./row-actions";
import type { UserRole, UserStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Менеджеры",
};

type StaffProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
};

type AuthUser = { id: string; email: string | null; last_sign_in_at: string | null };

export default async function ManagersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (ownProfile?.role !== "admin") redirect("/admin");

  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, status, created_at")
    .in("role", ["manager", "admin"])
    .order("created_at", { ascending: false })
    .returns<StaffProfile[]>();

  // Fetch emails via auth admin REST (supabase-js doesn't return auth.users data easily)
  const ids = (staff ?? []).map((s) => s.id);
  const emailsById = new Map<string, AuthUser>();
  if (ids.length > 0) {
    const admin = createSupabaseAdminClient();
    const res = await admin.auth.admin.listUsers({ perPage: 200 });
    if (!res.error && res.data?.users) {
      for (const u of res.data.users) {
        emailsById.set(u.id, {
          id: u.id,
          email: u.email ?? null,
          last_sign_in_at: u.last_sign_in_at ?? null,
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Менеджеры</h1>
        <p className="mt-2 text-muted-foreground">
          Сотрудники с доступом к админке. Только администратор может приглашать
          и менять роли.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Пригласить сотрудника</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteStaffForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сотрудники ({staff?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {staff && staff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead className="w-44 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => {
                  const auth = emailsById.get(s.id);
                  const isSelf = s.id === user.id;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.full_name ?? "—"}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (вы)
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {auth?.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {s.role === "admin" ? "Администратор" : "Менеджер"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "active"
                              ? "default"
                              : s.status === "blocked"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {s.status === "active"
                            ? "Активен"
                            : s.status === "blocked"
                              ? "Заблокирован"
                              : "Ожидает"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {auth?.last_sign_in_at
                          ? new Date(auth.last_sign_in_at).toLocaleDateString("ru")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <StaffRowActions
                            userId={s.id}
                            role={s.role}
                            status={s.status}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Сотрудников нет.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
