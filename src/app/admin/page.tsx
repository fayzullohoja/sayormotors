import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const ACTIVE_STATUSES: RequestStatus[] = [
  "new",
  "in_progress",
  "awaiting_clarification",
  "partial",
  "awaiting_payment",
  "ordered",
  "ready_for_shipment",
];

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: pendingApps },
    { count: activeClients },
    { count: productsTotal },
    { count: productsActive },
    { count: requestsActive },
    { count: requestsToday },
    { count: vinActive },
    { data: recentImports },
    { data: recentRequests },
    { data: topApplications },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("application_status", "pending"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .or("application_status.eq.approved,application_status.is.null"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .in("status", ACTIVE_STATUSES),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ),
    supabase
      .from("vin_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "in_progress", "quoted"]),
    supabase
      .from("excel_imports")
      .select(
        "id, file_name, status, total_rows, created_count, updated_count, error_count, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("requests")
      .select(
        "id, number, status, total_amount, display_currency, created_at, company:companies(name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("companies")
      .select("id, name, contact_person, application_email, created_at")
      .eq("application_status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Дашборд</h1>
        <p className="mt-2 text-muted-foreground">
          Сводка по заявкам, клиентам и каталогу.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="B2B-заявок ожидают"
          value={pendingApps ?? 0}
          href="/admin/applications"
          accent={(pendingApps ?? 0) > 0 ? "warn" : undefined}
        />
        <StatCard
          label="Активных заявок"
          value={requestsActive ?? 0}
          href="/admin/requests"
          accent={(requestsActive ?? 0) > 0 ? "ok" : undefined}
        />
        <StatCard
          label="VIN-запросов"
          value={vinActive ?? 0}
          href="/admin/vin"
        />
        <StatCard
          label="Заявок за 24ч"
          value={requestsToday ?? 0}
        />
        <StatCard
          label="Активных клиентов"
          value={activeClients ?? 0}
          href="/admin/clients"
        />
        <StatCard
          label="Товаров активных"
          value={productsActive ?? 0}
          subValue={`${productsTotal ?? 0} всего`}
          href="/admin/products"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Последние заявки</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/requests">Все заявки</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentRequests && recentRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№</TableHead>
                    <TableHead>Компания</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((r) => {
                    const company = r.company as unknown as { name: string } | null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Link
                            href={`/admin/requests/${r.id}`}
                            className="font-mono hover:underline"
                          >
                            №{r.number}
                          </Link>
                        </TableCell>
                        <TableCell>{company?.name ?? "—"}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(r.total_amount, r.display_currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              REQUEST_STATUS_VARIANT[r.status as RequestStatus]
                            }
                          >
                            {REQUEST_STATUS_LABEL[r.status as RequestStatus]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Заявок нет.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>B2B-заявки</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/applications">Все</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topApplications && topApplications.length > 0 ? (
              topApplications.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.contact_person ?? a.application_email ?? "—"}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("ru")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Новых заявок нет.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Последние загрузки Excel</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/imports">К загрузкам</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentImports && recentImports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Файл</TableHead>
                  <TableHead>Всего</TableHead>
                  <TableHead>Создано</TableHead>
                  <TableHead>Обновлено</TableHead>
                  <TableHead>Ошибок</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentImports.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="font-mono text-xs">
                      {imp.file_name}
                    </TableCell>
                    <TableCell>{imp.total_rows}</TableCell>
                    <TableCell className="text-emerald-600">
                      {imp.created_count}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      {imp.updated_count}
                    </TableCell>
                    <TableCell className="text-rose-600">
                      {imp.error_count}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(imp.created_at).toLocaleDateString("ru")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Каталог ещё не загружали. Начните с{" "}
              <Link
                href="/admin/imports"
                className="text-primary hover:underline"
              >
                /admin/imports
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  href,
  accent,
}: {
  label: string;
  value: number;
  subValue?: string;
  href?: string;
  accent?: "ok" | "warn";
}) {
  const valueClass =
    accent === "warn"
      ? "text-amber-600"
      : accent === "ok"
        ? "text-emerald-600"
        : "";
  const inner = (
    <div className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${valueClass}`}>
        {value.toLocaleString("ru")}
      </div>
      {subValue ? (
        <div className="mt-1 text-xs text-muted-foreground">{subValue}</div>
      ) : null}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
