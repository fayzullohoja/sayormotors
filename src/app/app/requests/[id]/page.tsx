import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
  REQUEST_ITEM_STATUS_LABEL,
  REQUEST_ITEM_STATUS_VARIANT,
} from "@/lib/request-status";
import { formatPrice } from "@/lib/pricing";
import type {
  Currency,
  RequestStatus,
  RequestItemStatus,
} from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "Заявка",
};

type RequestRow = {
  id: string;
  number: number;
  status: RequestStatus;
  total_amount: number;
  display_currency: Currency;
  contact_method: string | null;
  client_comment: string | null;
  manager_comment: string | null;
  created_at: string;
  confirmed_at: string | null;
  closed_at: string | null;
};

type RequestItemRow = {
  id: string;
  article_input: string;
  name_snapshot: string | null;
  brand_snapshot: string | null;
  qty_requested: number;
  qty_confirmed: number | null;
  price_at_request: number | null;
  price_confirmed: number | null;
  currency: Currency | null;
  status: RequestItemStatus;
  manager_comment: string | null;
};

type HistoryRow = {
  id: number;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export default async function RequestDetailPage({
  params,
}: PageProps<"/app/requests/[id]">) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, number, status, total_amount, display_currency, contact_method, client_comment, manager_comment, created_at, confirmed_at, closed_at",
    )
    .eq("id", id)
    .maybeSingle<RequestRow>();
  if (!request) notFound();

  const { data: items } = await supabase
    .from("request_items")
    .select(
      "id, article_input, name_snapshot, brand_snapshot, qty_requested, qty_confirmed, price_at_request, price_confirmed, currency, status, manager_comment",
    )
    .eq("request_id", request.id)
    .order("created_at", { ascending: true })
    .returns<RequestItemRow[]>();

  const { data: history } = await supabase
    .from("request_history")
    .select("id, event_type, payload, created_at")
    .eq("request_id", request.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<HistoryRow[]>();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link href="/app/requests" className="hover:underline">
            Мои заявки
          </Link>{" "}
          / №{request.number}
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Заявка №{request.number}
          </h1>
          <Badge variant={REQUEST_STATUS_VARIANT[request.status]}>
            {REQUEST_STATUS_LABEL[request.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Создана: {new Date(request.created_at).toLocaleString("ru")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Позиции</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Артикул</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Запрошено</TableHead>
                <TableHead>Подтверждено</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Комментарий</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-xs">
                    {it.article_input}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="line-clamp-1">{it.name_snapshot ?? "—"}</div>
                    {it.brand_snapshot ? (
                      <div className="text-xs text-muted-foreground">
                        {it.brand_snapshot}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{it.qty_requested}</TableCell>
                  <TableCell>
                    {it.qty_confirmed ?? "—"}
                  </TableCell>
                  <TableCell>
                    {it.price_confirmed != null ? (
                      <div className="font-medium">
                        {formatPrice(it.price_confirmed, it.currency ?? "EUR")}
                      </div>
                    ) : it.price_at_request != null ? (
                      <div className="text-muted-foreground">
                        {formatPrice(it.price_at_request, it.currency ?? "EUR")}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={REQUEST_ITEM_STATUS_VARIANT[it.status]}>
                      {REQUEST_ITEM_STATUS_LABEL[it.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    <span className="line-clamp-1">
                      {it.manager_comment ?? "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Итого
              </div>
              <div className="text-2xl font-semibold">
                {formatPrice(request.total_amount, request.display_currency)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Связь</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Способ" value={request.contact_method ?? "—"} />
            <Field label="Комментарий клиента" value={request.client_comment ?? "—"} />
            <Field label="Комментарий менеджера" value={request.manager_comment ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История</CardTitle>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex justify-between gap-4">
                    <div>
                      <div className="font-medium">{h.event_type}</div>
                      {h.payload ? (
                        <pre className="mt-1 text-xs text-muted-foreground">
                          {JSON.stringify(h.payload, null, 2).slice(0, 200)}
                        </pre>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString("ru")}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Нет событий.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/app/requests">Назад к списку</Link>
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}
