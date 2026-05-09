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
import type { VinRequestStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "VIN-запросы",
};

const STATUS_LABEL: Record<VinRequestStatus, string> = {
  new: "Новый",
  in_progress: "В обработке",
  quoted: "Подобрано",
  rejected: "Отклонён",
  completed: "Завершён",
};

const STATUS_VARIANT: Record<
  VinRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "secondary",
  in_progress: "default",
  quoted: "outline",
  rejected: "destructive",
  completed: "default",
};

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "active", label: "Активные" },
  { value: "all", label: "Все" },
  { value: "new", label: "Новые" },
  { value: "in_progress", label: "В обработке" },
  { value: "quoted", label: "Подобрано" },
  { value: "completed", label: "Завершены" },
];

const ACTIVE_STATUSES: VinRequestStatus[] = ["new", "in_progress", "quoted"];

type VinRow = {
  id: string;
  number: number;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  what_needed: string;
  status: VinRequestStatus;
  created_at: string;
  company: { name: string } | null;
};

export default async function AdminVinPage({
  searchParams,
}: PageProps<"/admin/vin">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "active";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("vin_requests")
    .select(
      "id, number, vin, make, model, year, what_needed, status, created_at, company:companies(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status === "active") {
    query = query.in("status", ACTIVE_STATUSES);
  } else if (status !== "all") {
    query = query.eq("status", status as VinRequestStatus);
  }

  const { data } = await query.returns<VinRow[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">VIN-запросы</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            asChild
            size="sm"
            variant={status === f.value ? "default" : "outline"}
          >
            <Link
              href={{ pathname: "/admin/vin", query: { status: f.value } }}
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
                <TableHead>VIN</TableHead>
                <TableHead>Авто</TableHead>
                <TableHead>Что нужно</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/admin/vin/${r.id}`}
                      className="font-mono hover:underline"
                    >
                      №{r.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("ru")}
                  </TableCell>
                  <TableCell>{r.company?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.vin}</TableCell>
                  <TableCell className="text-sm">
                    {[r.make, r.model, r.year ?? ""].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="line-clamp-2 text-sm">{r.what_needed}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>
                      {STATUS_LABEL[r.status]}
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
            VIN-запросов нет.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
