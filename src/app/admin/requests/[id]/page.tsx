import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_VARIANT,
} from "@/lib/request-status";
import { formatPrice } from "@/lib/pricing";
import type {
  Currency,
  RequestStatus,
  RequestItemStatus,
} from "@/lib/supabase/types";
import { ManageForm } from "./manage-form";

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
  assigned_manager_id: string | null;
  company: {
    id: string;
    name: string;
    contact_person: string | null;
    phone: string | null;
    telegram: string | null;
    whatsapp: string | null;
    email: string | null;
  } | null;
  creator: { full_name: string | null } | null;
  manager: { full_name: string | null } | null;
};

type RequestItemRow = {
  id: string;
  product_id: string | null;
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
  changed_by: string | null;
};

export default async function AdminRequestDetailPage({
  params,
}: PageProps<"/admin/requests/[id]">) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, number, status, total_amount, display_currency, contact_method, client_comment, manager_comment, created_at, confirmed_at, closed_at, assigned_manager_id, company:companies(id,name,contact_person,phone,telegram,whatsapp,email), creator:profiles!requests_created_by_fkey(full_name), manager:profiles!requests_assigned_manager_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle<RequestRow>();
  if (!request) notFound();

  const { data: items } = await supabase
    .from("request_items")
    .select(
      "id, product_id, article_input, name_snapshot, brand_snapshot, qty_requested, qty_confirmed, price_at_request, price_confirmed, currency, status, manager_comment",
    )
    .eq("request_id", request.id)
    .order("created_at", { ascending: true })
    .returns<RequestItemRow[]>();

  const { data: history } = await supabase
    .from("request_history")
    .select("id, event_type, payload, created_at, changed_by")
    .eq("request_id", request.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<HistoryRow[]>();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link href="/admin/requests" className="hover:underline">
            Заявки
          </Link>{" "}
          / №{request.number}
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Заявка №{request.number}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {request.company?.name} · создана{" "}
              {new Date(request.created_at).toLocaleString("ru")} ·{" "}
              {request.creator?.full_name ?? "клиент"}
              {request.manager?.full_name
                ? ` · менеджер: ${request.manager.full_name}`
                : ""}
            </p>
          </div>
          <Badge variant={REQUEST_STATUS_VARIANT[request.status]}>
            {REQUEST_STATUS_LABEL[request.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Контакт</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="Компания" value={request.company?.name ?? "—"} />
            <Field
              label="Контактное лицо"
              value={request.company?.contact_person ?? "—"}
            />
            <Field label="Телефон" value={request.company?.phone ?? "—"} />
            <Field label="Telegram" value={request.company?.telegram ?? "—"} />
            <Field label="WhatsApp" value={request.company?.whatsapp ?? "—"} />
            <Field label="Email" value={request.company?.email ?? "—"} />
            <Field
              label="Способ связи (выбран клиентом)"
              value={request.contact_method ?? "—"}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Комментарий клиента</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {request.client_comment ? (
              <p className="whitespace-pre-wrap">{request.client_comment}</p>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Позиции и итог:{" "}
            <span className="font-mono">
              {formatPrice(request.total_amount, request.display_currency)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ManageForm
            requestId={request.id}
            currentStatus={request.status}
            currentManagerComment={request.manager_comment ?? ""}
            assigned={!!request.assigned_manager_id}
            items={(items ?? []).map((it) => ({
              id: it.id,
              article: it.article_input,
              name: it.name_snapshot,
              brand: it.brand_snapshot,
              qty_requested: it.qty_requested,
              qty_confirmed: it.qty_confirmed,
              price_at_request: it.price_at_request,
              price_confirmed: it.price_confirmed,
              currency: it.currency,
              status: it.status,
              manager_comment: it.manager_comment,
            }))}
          />
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
                      <pre className="mt-1 max-w-xl overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                        {JSON.stringify(h.payload, null, 2)}
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
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
