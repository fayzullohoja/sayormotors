import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
import { VinForm } from "./form";
import type { VinRequestStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "VIN-запрос",
};

const VIN_STATUS_LABEL: Record<VinRequestStatus, string> = {
  new: "Новый",
  in_progress: "В обработке",
  quoted: "Подобрано",
  rejected: "Отклонён",
  completed: "Завершён",
};

type VinRow = {
  id: string;
  number: number;
  vin: string;
  what_needed: string;
  status: VinRequestStatus;
  created_at: string;
};

export default async function VinPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, company_id")
    .eq("id", user.id)
    .maybeSingle();

  let recent: VinRow[] = [];
  if (profile?.company_id) {
    const { data } = await supabase
      .from("vin_requests")
      .select("id, number, vin, what_needed, status, created_at")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<VinRow[]>();
    recent = data ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">VIN-запрос</h1>
        <p className="mt-2 text-muted-foreground">
          Менеджер подберёт запчасти по VIN вашего автомобиля. Опишите, что
          именно нужно.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Новый запрос</CardTitle>
          </CardHeader>
          <CardContent>
            <VinForm canSubmit={profile?.status === "active"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Мои VIN-запросы</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Запросов нет.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>№{r.number}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.vin}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {VIN_STATUS_LABEL[r.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
