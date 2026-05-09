import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_VARIANT,
} from "@/lib/request-status";
import { formatPrice } from "@/lib/pricing";
import type { RequestStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Заявки",
};

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "new", label: "Новые" },
  { value: "in_progress", label: "В обработке" },
  { value: "awaiting_clarification", label: "Уточнения" },
  { value: "confirmed", label: "Подтверждены" },
  { value: "partial", label: "Частично" },
  { value: "completed", label: "Завершены" },
  { value: "cancelled", label: "Отменены" },
];

type RequestRow = {
  id: string;
  number: number;
  status: RequestStatus;
  total_amount: number;
  display_currency: string;
  created_at: string;
  client_comment: string | null;
  company: { name: string } | null;
  creator: { full_name: string | null } | null;
  manager: { full_name: string | null } | null;
};

const ACTIVE_STATUSES: RequestStatus[] = [
  "new",
  "in_progress",
  "awaiting_clarification",
  "partial",
  "awaiting_payment",
  "ordered",
  "ready_for_shipment",
];

export default async function AdminRequestsPage({
  searchParams,
}: PageProps<"/admin/requests">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "active";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("requests")
    .select(
      "id, number, status, total_amount, display_currency, created_at, client_comment, company:companies(name), creator:profiles!requests_created_by_fkey(full_name), manager:profiles!requests_assigned_manager_id_fkey(full_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status === "active") {
    query = query.in("status", ACTIVE_STATUSES);
  } else if (status !== "all") {
    query = query.eq("status", status as RequestStatus);
  }

  const { data, count } = await query.returns<RequestRow[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Заявки</h1>
        <p className="mt-2 text-muted-foreground">
          Всего: {count ?? 0}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            asChild
            size="sm"
            variant={status === f.value ? "default" : "outline"}
          >
            <Link
              href={{
                pathname: "/admin/requests",
                query: { status: f.value },
              }}
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      {data && data.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Компания</TableHead>
                <TableHead>Создал</TableHead>
                <TableHead>Менеджер</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="font-mono hover:underline"
                    >
                      №{r.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ru")}
                  </TableCell>
                  <TableCell>{r.company?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.creator?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.manager?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(r.total_amount, r.display_currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={REQUEST_STATUS_VARIANT[r.status]}>
                      {REQUEST_STATUS_LABEL[r.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Заявок нет.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
