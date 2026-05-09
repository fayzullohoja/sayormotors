import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ListChecks, ScanBarcode, ShoppingCart, FileText } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RequestSummary = {
  id: string;
  number: number;
  status: string;
  total_amount: number;
  display_currency: string;
  created_at: string;
};

export default async function ClientHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, company_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  let recent: RequestSummary[] = [];
  let lastImport: { last_imported_at: string | null } | null = null;
  if (profile?.company_id) {
    const [{ data: requests }, { data: imp }] = await Promise.all([
      supabase
        .from("requests")
        .select("id, number, status, total_amount, display_currency, created_at")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<RequestSummary[]>(),
      supabase
        .from("excel_imports")
        .select("finished_at")
        .eq("status", "completed")
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ finished_at: string | null }>(),
    ]);
    recent = requests ?? [];
    lastImport = imp ? { last_imported_at: imp.finished_at } : null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {profile?.full_name ? `Здравствуйте, ${profile.full_name}` : "B2B-кабинет"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Поиск запчастей, массовая проверка и заявки.
          </p>
        </div>
        {lastImport?.last_imported_at ? (
          <div className="text-xs text-muted-foreground">
            База обновлена:{" "}
            {new Date(lastImport.last_imported_at).toLocaleString("ru")}
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск по артикулу</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/app/search" method="get" className="flex gap-3">
            <Input
              name="q"
              placeholder="34116859066 — введите артикул"
              autoFocus
              className="font-mono"
            />
            <Button type="submit">Найти</Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            Для проверки 50+ артикулов используйте{" "}
            <Link href="/app/bulk" className="text-primary hover:underline">
              массовую проверку
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ShortcutCard
          href="/app/bulk"
          icon={<ListChecks className="size-5" />}
          title="Массовая проверка"
          description="До 60 артикулов за раз"
        />
        <ShortcutCard
          href="/app/vin"
          icon={<ScanBarcode className="size-5" />}
          title="VIN-запрос"
          description="Подбор по VIN от менеджера"
        />
        <ShortcutCard
          href="/app/cart"
          icon={<ShoppingCart className="size-5" />}
          title="Корзина"
          description="Сформировать заявку"
        />
        <ShortcutCard
          href="/app/requests"
          icon={<FileText className="size-5" />}
          title="Мои заявки"
          description="История и статусы"
        />
      </div>

      {recent.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Последние заявки</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
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
                      {new Date(r.created_at).toLocaleDateString("ru")}
                    </TableCell>
                    <TableCell>
                      {r.total_amount.toFixed(2)} {r.display_currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ShortcutCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-accent p-2 text-primary">{icon}</span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}
