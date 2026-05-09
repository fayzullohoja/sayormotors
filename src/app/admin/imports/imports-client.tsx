"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CANONICAL_LABELS } from "@/lib/excel/headers";
import type { CanonicalField, ParseResult, ParsedRow } from "@/lib/excel/types";
import {
  parseExcelAction,
  applyImportAction,
  type ApplySummary,
} from "./actions";

type SupplierProfile = {
  id: string;
  name: string;
  default_currency: string;
  default_source: string;
};

type Stage =
  | { kind: "idle" }
  | { kind: "parsing" }
  | {
      kind: "parsed";
      fileName: string;
      result: ParseResult;
      mapping: Record<CanonicalField, string>;
    }
  | { kind: "applying" }
  | { kind: "applied"; summary: ApplySummary };

const REQUIRED: CanonicalField[] = ["article", "name", "base_price"];
const ALL_FIELDS = Object.keys(CANONICAL_LABELS) as CanonicalField[];

export function ImportClient({ profiles }: { profiles: SupplierProfile[] }) {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [supplierProfileId, setSupplierProfileId] = useState<string>("none");
  const [defaultCurrency, setDefaultCurrency] = useState<string>("EUR");
  const [defaultSource, setDefaultSource] = useState<string>("other");
  const [, startTransition] = useTransition();

  const profile = profiles.find((p) => p.id === supplierProfileId);
  const currentCurrency = profile?.default_currency ?? defaultCurrency;
  const currentSource = profile?.default_source ?? defaultSource;

  const handleUpload = (formData: FormData) => {
    setStage({ kind: "parsing" });
    startTransition(async () => {
      const res = await parseExcelAction(null, formData);
      if (!res.ok) {
        setStage({ kind: "idle" });
        toast.error(res.error);
        return;
      }
      const initialMapping = ALL_FIELDS.reduce(
        (acc, f) => {
          acc[f] = res.result.detected[f] ?? "";
          return acc;
        },
        {} as Record<CanonicalField, string>,
      );
      setStage({
        kind: "parsed",
        fileName: res.fileName,
        result: res.result,
        mapping: initialMapping,
      });
    });
  };

  const handleApply = () => {
    if (stage.kind !== "parsed") return;
    const missingRequired = REQUIRED.filter((f) => !stage.mapping[f]);
    if (missingRequired.length > 0) {
      toast.error(
        `Не указаны колонки: ${missingRequired.map((f) => CANONICAL_LABELS[f]).join(", ")}`,
      );
      return;
    }
    if (stage.result.rows.length === 0) {
      toast.error("Нет валидных строк для применения");
      return;
    }

    setStage({ kind: "applying" });
    startTransition(async () => {
      const rows: ParsedRow[] = stage.result.rows;
      const res = await applyImportAction({
        fileName: stage.fileName,
        rows,
        supplierProfileId:
          supplierProfileId === "none" ? null : supplierProfileId,
        defaults: { currency: currentCurrency, source: currentSource },
      });
      if (!res.ok) {
        setStage(stage);
        toast.error(res.error);
        return;
      }
      toast.success(
        `Готово: ${res.summary.created} новых, ${res.summary.updated} обновлено`,
      );
      setStage({ kind: "applied", summary: res.summary });
    });
  };

  if (stage.kind === "applied") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-emerald-50 p-5 text-emerald-900">
          <h3 className="text-lg font-semibold">Загрузка применена</h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <Stat label="Всего" value={stage.summary.total} />
            <Stat label="Создано" value={stage.summary.created} />
            <Stat label="Обновлено" value={stage.summary.updated} />
            <Stat label="Ошибок" value={stage.summary.failed} />
          </dl>
        </div>
        {stage.summary.errors.length > 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              <details>
                <summary className="cursor-pointer font-medium">
                  Ошибки ({stage.summary.errors.length})
                </summary>
                <ul className="mt-2 max-h-60 overflow-auto text-xs">
                  {stage.summary.errors.map((e, i) => (
                    <li key={i}>
                      Строка {e.rowIndex}: {e.message}
                    </li>
                  ))}
                </ul>
              </details>
            </AlertDescription>
          </Alert>
        ) : null}
        <Button onClick={() => setStage({ kind: "idle" })}>Загрузить ещё</Button>
      </div>
    );
  }

  if (stage.kind === "parsed") {
    return (
      <div className="space-y-6">
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{stage.fileName}</div>
              <div className="text-xs text-muted-foreground">
                Всего строк: {stage.result.totalRows} · Валидных:{" "}
                {stage.result.rows.length} · Ошибок: {stage.result.errors.length}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStage({ kind: "idle" })}
            >
              Выбрать другой файл
            </Button>
          </div>
        </div>

        <section>
          <h3 className="mb-3 text-sm font-medium">Маппинг колонок</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {ALL_FIELDS.map((field) => (
              <div key={field} className="grid grid-cols-[140px_1fr] items-center gap-3">
                <Label className="text-sm">
                  {CANONICAL_LABELS[field]}
                  {REQUIRED.includes(field) ? (
                    <span className="ml-1 text-destructive">*</span>
                  ) : null}
                </Label>
                <Select
                  value={stage.mapping[field] || "_none"}
                  onValueChange={(value) => {
                    setStage((prev) =>
                      prev.kind === "parsed"
                        ? {
                            ...prev,
                            mapping: {
                              ...prev.mapping,
                              [field]: value === "_none" ? "" : value,
                            },
                          }
                        : prev,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— не использовать —</SelectItem>
                    {stage.result.headers
                      .filter((h) => h.length > 0)
                      .map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </section>

        {stage.result.errors.length > 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              <details>
                <summary className="cursor-pointer font-medium">
                  Ошибки парсинга ({stage.result.errors.length})
                </summary>
                <ul className="mt-2 max-h-60 overflow-auto text-xs">
                  {stage.result.errors.slice(0, 200).map((e, i) => (
                    <li key={i}>
                      Строка {e.rowIndex}
                      {e.column ? ` (${e.column})` : ""}: {e.message}
                    </li>
                  ))}
                </ul>
              </details>
            </AlertDescription>
          </Alert>
        ) : null}

        <section>
          <h3 className="mb-3 text-sm font-medium">
            Превью (первые 10 валидных строк)
          </h3>
          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Артикул</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Бренд</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Валюта</TableHead>
                  <TableHead>Наличие</TableHead>
                  <TableHead>Источник</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stage.result.rows.slice(0, 10).map((r) => (
                  <TableRow key={r.rowIndex}>
                    <TableCell className="font-mono text-xs">{r.article}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.brand ?? "—"}</TableCell>
                    <TableCell>{r.base_price?.toFixed(2) ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.base_currency ?? currentCurrency}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.stock}</TableCell>
                    <TableCell>{r.source ?? currentSource}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setStage({ kind: "idle" })}
          >
            Отмена
          </Button>
          <Button onClick={handleApply}>
            Применить ({stage.result.rows.length} строк)
          </Button>
        </div>
      </div>
    );
  }

  if (stage.kind === "parsing" || stage.kind === "applying") {
    return (
      <div className="rounded-md border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        {stage.kind === "parsing" ? "Читаем файл…" : "Применяем загрузку…"}
      </div>
    );
  }

  return (
    <form
      action={handleUpload}
      className="space-y-4"
      encType="multipart/form-data"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="file">Файл Excel (.xlsx, .xls, .csv)</Label>
          <Input
            id="file"
            name="file"
            type="file"
            accept=".xlsx,.xls,.csv"
            required
          />
          <p className="text-xs text-muted-foreground">
            До 50 МБ. Первая строка — заголовки колонок.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Профиль поставщика</Label>
          <Select value={supplierProfileId} onValueChange={setSupplierProfileId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— без профиля —</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Валюта по умолчанию</Label>
          <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="CNY">CNY</SelectItem>
              <SelectItem value="RUB">RUB</SelectItem>
              <SelectItem value="UZS">UZS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Источник по умолчанию</Label>
          <Select value={defaultSource} onValueChange={setDefaultSource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="germany">Германия</SelectItem>
              <SelectItem value="china">Китай</SelectItem>
              <SelectItem value="warehouse">Склад</SelectItem>
              <SelectItem value="transit">Транзит</SelectItem>
              <SelectItem value="other">Другое</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit">Прочитать файл</Button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
