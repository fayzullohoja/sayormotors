import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Клиенты",
};

type ClientRow = {
  id: string;
  name: string;
  inn: string | null;
  contact_person: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  pricing_group: string | null;
  discount_percent: number | null;
  default_currency: string | null;
  created_at: string;
};

async function loadClients() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("companies")
    .select(
      "id, name, inn, contact_person, phone, city, country, is_active, pricing_group, discount_percent, default_currency, created_at",
    )
    .or("application_status.is.null,application_status.eq.approved")
    .order("created_at", { ascending: false })
    .returns<ClientRow[]>();
  return data ?? [];
}

export default async function ClientsPage() {
  const clients = await loadClients();
  const active = clients.filter((c) => c.is_active);
  const blocked = clients.filter((c) => !c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Клиенты</h1>
          <p className="mt-2 text-muted-foreground">
            Активные {active.length} · Заблокированы {blocked.length}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/applications">B2B-заявки</Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Клиентов нет. Они появятся, когда вы одобрите B2B-заявку.
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Компания</TableHead>
                <TableHead>Контакт</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Группа</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead>Валюта</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.inn ? (
                      <div className="text-xs text-muted-foreground">
                        ИНН: {c.inn}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div>{c.contact_person ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.phone ?? ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[c.city, c.country].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.pricing_group ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.discount_percent ? `${c.discount_percent}%` : "0%"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.default_currency ?? "EUR"}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.is_active ? (
                      <Badge>Активен</Badge>
                    ) : (
                      <Badge variant="destructive">Заблокирован</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("ru")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
