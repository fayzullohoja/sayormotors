import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportClient } from "./imports-client";

export const metadata: Metadata = {
  title: "Загрузка Excel",
};

type SupplierProfile = {
  id: string;
  name: string;
  default_currency: string;
  default_source: string;
  last_imported_at: string | null;
};

type ImportRow = {
  id: string;
  file_name: string;
  total_rows: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  status: string;
  created_at: string;
  finished_at: string | null;
};

export default async function ImportsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: profiles }, { data: imports }] = await Promise.all([
    supabase
      .from("supplier_profiles")
      .select("id, name, default_currency, default_source, last_imported_at")
      .eq("is_active", true)
      .order("name")
      .returns<SupplierProfile[]>(),
    supabase
      .from("excel_imports")
      .select(
        "id, file_name, total_rows, created_count, updated_count, error_count, status, created_at, finished_at",
      )
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<ImportRow[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Загрузка Excel</h1>
        <p className="mt-2 text-muted-foreground">
          Загрузите файл, проверьте маппинг колонок и подтвердите обновление каталога.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая загрузка</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportClient profiles={profiles ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История загрузок</CardTitle>
        </CardHeader>
        <CardContent>
          {imports && imports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Файл</TableHead>
                  <TableHead>Всего</TableHead>
                  <TableHead>Создано</TableHead>
                  <TableHead>Обновлено</TableHead>
                  <TableHead>Ошибок</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="font-mono text-xs">{imp.file_name}</TableCell>
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
                    <TableCell>
                      <Badge
                        variant={
                          imp.status === "completed"
                            ? "default"
                            : imp.status === "completed_with_errors"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {imp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(imp.created_at).toLocaleString("ru")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">Пока нет загрузок.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
