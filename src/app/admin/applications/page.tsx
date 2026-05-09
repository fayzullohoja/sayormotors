import type { Metadata } from "next";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApplicationActions } from "./actions-ui";

export const metadata: Metadata = {
  title: "B2B-заявки",
};

type CompanyRow = {
  id: string;
  name: string;
  application_email: string | null;
  application_status: "pending" | "approved" | "rejected";
  application_comment: string | null;
  contact_person: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  inn: string | null;
  city: string | null;
  country: string | null;
  client_type: string | null;
  created_at: string;
};

async function loadApplications() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("companies")
    .select(
      "id, name, application_email, application_status, application_comment, contact_person, phone, telegram, whatsapp, inn, city, country, client_type, created_at",
    )
    .not("application_email", "is", null)
    .order("created_at", { ascending: false })
    .returns<CompanyRow[]>();
  return data ?? [];
}

export default async function ApplicationsPage() {
  const all = await loadApplications();
  const pending = all.filter((r) => r.application_status === "pending");
  const approved = all.filter((r) => r.application_status === "approved");
  const rejected = all.filter((r) => r.application_status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">B2B-заявки</h1>
        <p className="mt-2 text-muted-foreground">
          Заявки на доступ. Подтверждение отправляет приглашение на email.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Ожидают
            <span className="ml-2 rounded-full bg-amber-100 px-2 text-xs text-amber-800">
              {pending.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Одобрены
            <span className="ml-2 rounded-full bg-emerald-100 px-2 text-xs text-emerald-800">
              {approved.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Отклонены
            <span className="ml-2 rounded-full bg-rose-100 px-2 text-xs text-rose-800">
              {rejected.length}
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <ApplicationsTable rows={pending} showActions />
        </TabsContent>
        <TabsContent value="approved">
          <ApplicationsTable rows={approved} />
        </TabsContent>
        <TabsContent value="rejected">
          <ApplicationsTable rows={rejected} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApplicationsTable({
  rows,
  showActions,
}: {
  rows: CompanyRow[];
  showActions?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        Заявок нет.
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Компания</TableHead>
            <TableHead>Контакт</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Город</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead className="w-44 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">
                <div>{r.name}</div>
                {r.inn ? (
                  <div className="text-xs text-muted-foreground">ИНН: {r.inn}</div>
                ) : null}
                {r.application_comment ? (
                  <div className="mt-1 max-w-xs text-xs text-muted-foreground">
                    {r.application_comment}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                <div>{r.contact_person ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{r.phone ?? ""}</div>
                {r.telegram ? (
                  <div className="text-xs text-muted-foreground">
                    TG: {r.telegram}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {r.application_email}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{r.client_type ?? "—"}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {[r.city, r.country].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("ru")}
              </TableCell>
              <TableCell className="text-right">
                {showActions ? (
                  <ApplicationActions companyId={r.id} email={r.application_email} />
                ) : (
                  <Badge
                    variant={
                      r.application_status === "approved"
                        ? "default"
                        : r.application_status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {r.application_status === "approved"
                      ? "Одобрена"
                      : r.application_status === "rejected"
                        ? "Отклонена"
                        : "Ожидает"}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
