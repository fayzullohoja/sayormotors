import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  REQUEST_STATUS_LABEL,
  REQUEST_ITEM_STATUS_LABEL,
} from "@/lib/request-status";
import type {
  RequestStatus,
  RequestItemStatus,
} from "@/lib/supabase/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: req } = await supabase
    .from("requests")
    .select(
      "id, number, status, total_amount, display_currency, contact_method, client_comment, manager_comment, created_at, company:companies(name,inn,contact_person,phone,email,city,country)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!req) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("request_items")
    .select(
      "article_input, name_snapshot, brand_snapshot, qty_requested, qty_confirmed, price_at_request, price_confirmed, currency, status, manager_comment",
    )
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const company = req.company as unknown as
    | {
        name: string;
        inn: string | null;
        contact_person: string | null;
        phone: string | null;
        email: string | null;
        city: string | null;
        country: string | null;
      }
    | null;

  const wb = XLSX.utils.book_new();

  // Sheet 1 — позиции
  const itemsRows = (items ?? []).map((it) => {
    const item = it as {
      article_input: string;
      name_snapshot: string | null;
      brand_snapshot: string | null;
      qty_requested: number;
      qty_confirmed: number | null;
      price_at_request: number | null;
      price_confirmed: number | null;
      currency: string | null;
      status: RequestItemStatus;
      manager_comment: string | null;
    };
    const finalPrice = item.price_confirmed ?? item.price_at_request ?? 0;
    const finalQty = item.qty_confirmed ?? item.qty_requested;
    return {
      "Артикул": item.article_input,
      "Название": item.name_snapshot ?? "",
      "Бренд": item.brand_snapshot ?? "",
      "Запрошено": item.qty_requested,
      "Подтверждено": item.qty_confirmed ?? "",
      "Цена за шт": finalPrice,
      "Валюта": item.currency ?? req.display_currency,
      "Сумма": finalQty * finalPrice,
      "Статус": REQUEST_ITEM_STATUS_LABEL[item.status],
      "Комментарий менеджера": item.manager_comment ?? "",
    };
  });

  const itemsSheet = XLSX.utils.json_to_sheet(itemsRows);
  // column widths
  itemsSheet["!cols"] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, itemsSheet, "Позиции");

  // Sheet 2 — шапка
  const summaryRows: Array<{ A: string; B: string | number }> = [
    { A: "Номер заявки", B: `№${req.number}` },
    { A: "Статус", B: REQUEST_STATUS_LABEL[req.status as RequestStatus] },
    { A: "Дата создания", B: new Date(req.created_at).toLocaleString("ru") },
    { A: "Способ связи", B: req.contact_method ?? "—" },
    {
      A: "Итого",
      B: `${req.total_amount.toFixed(2)} ${req.display_currency}`,
    },
    { A: "", B: "" },
    { A: "Компания", B: company?.name ?? "—" },
    { A: "ИНН", B: company?.inn ?? "—" },
    { A: "Контактное лицо", B: company?.contact_person ?? "—" },
    { A: "Телефон", B: company?.phone ?? "—" },
    { A: "Email", B: company?.email ?? "—" },
    {
      A: "Город / страна",
      B: [company?.city, company?.country].filter(Boolean).join(", ") || "—",
    },
    { A: "", B: "" },
    { A: "Комментарий клиента", B: req.client_comment ?? "—" },
    { A: "Комментарий менеджера", B: req.manager_comment ?? "—" },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows, {
    skipHeader: true,
  });
  summarySheet["!cols"] = [{ wch: 24 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Заявка");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `request-${req.number}.xlsx`;

  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
