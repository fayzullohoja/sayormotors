import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import type { RequestStatus } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "Мои заявки",
};

type RequestRow = {
  id: string;
  number: number;
  status: RequestStatus;
  total_amount: number;
  display_currency: string;
  created_at: string;
  client_comment: string | null;
};

export default async function RequestsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.company_id) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Заявок ещё нет.
        </CardContent>
      </Card>
    );
  }

  const { data } = await supabase
    .from("requests")
    .select(
      "id, number, status, total_amount, display_currency, created_at, client_comment",
    )
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<RequestRow[]>();

  const requests = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Мои заявки</h1>
          <p className="mt-2 text-muted-foreground">
            История и текущий статус ваших заявок.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/cart">Новая заявка</Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Пока нет заявок. Найдите запчасти через{" "}
            <Link href="/app/search" className="text-primary hover:underline">
              поиск
            </Link>{" "}
            или{" "}
            <Link href="/app/bulk" className="text-primary hover:underline">
              массовую проверку
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Комментарий</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/app/requests/${r.id}`}
                      className="font-mono hover:underline"
                    >
                      №{r.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ru")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(r.total_amount, r.display_currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={REQUEST_STATUS_VARIANT[r.status]}>
                      {REQUEST_STATUS_LABEL[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    <span className="line-clamp-1">{r.client_comment ?? "—"}</span>
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
