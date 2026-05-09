import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

export const metadata: Metadata = {
  title: "Клиент",
};

type CompanyRow = {
  id: string;
  name: string;
  inn: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  application_email: string | null;
  telegram: string | null;
  whatsapp: string | null;
  city: string | null;
  country: string | null;
  legal_address: string | null;
  is_active: boolean;
  pricing_group: string | null;
  discount_percent: number | null;
  default_currency: string | null;
  client_type: string | null;
  internal_comment: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  telegram: string | null;
  status: "pending" | "active" | "blocked";
  role: "client" | "manager" | "admin";
};

export default async function ClientDetailPage({
  params,
}: PageProps<"/admin/clients/[id]">) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: company } = await supabase
    .from("companies")
    .select(
      "id, name, inn, contact_person, phone, email, application_email, telegram, whatsapp, city, country, legal_address, is_active, pricing_group, discount_percent, default_currency, client_type, internal_comment, created_at",
    )
    .eq("id", id)
    .maybeSingle<CompanyRow>();
  if (!company) notFound();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, telegram, status, role")
    .eq("company_id", id)
    .returns<Profile[]>();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href="/admin/clients" className="hover:underline">
              Клиенты
            </Link>{" "}
            / {company.name}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {company.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            {company.is_active ? (
              <Badge>Активен</Badge>
            ) : (
              <Badge variant="destructive">Заблокирован</Badge>
            )}
            <Badge variant="secondary">{company.pricing_group ?? "default"}</Badge>
            <Badge variant="outline">{company.default_currency ?? "EUR"}</Badge>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/clients">Назад</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Реквизиты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="ИНН" value={company.inn} />
            <Field label="Тип" value={company.client_type} />
            <Field
              label="Адрес"
              value={[company.city, company.country, company.legal_address]
                .filter(Boolean)
                .join(", ")}
            />
            <Field
              label="Скидка"
              value={
                company.discount_percent
                  ? `${company.discount_percent}%`
                  : "0%"
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Контакт</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Контактное лицо" value={company.contact_person} />
            <Field label="Телефон" value={company.phone} />
            <Field
              label="Email"
              value={company.email ?? company.application_email}
            />
            <Field label="Telegram" value={company.telegram} />
            <Field label="WhatsApp" value={company.whatsapp} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Пользователи компании</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles && profiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.full_name ?? "—"}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>{p.telegram ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "active"
                            ? "default"
                            : p.status === "blocked"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">
              Нет пользователей. Они появятся после принятия инвайта.
            </div>
          )}
        </CardContent>
      </Card>

      {company.internal_comment ? (
        <Card>
          <CardHeader>
            <CardTitle>Внутренний комментарий</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {company.internal_comment}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}
