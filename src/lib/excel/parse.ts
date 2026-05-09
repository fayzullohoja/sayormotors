import * as XLSX from "xlsx";
import { detectMapping } from "./headers";
import type {
  ColumnMapping,
  ParseError,
  ParseResult,
  ParsedRow,
} from "./types";
import { normalizeArticle } from "@/lib/article";

const VALID_CURRENCIES = new Set(["EUR", "USD", "CNY", "RUB", "UZS"]);
const VALID_SOURCES = new Set([
  "germany",
  "china",
  "warehouse",
  "transit",
  "other",
]);

const SOURCE_ALIASES: Record<string, string> = {
  germany: "germany",
  германия: "germany",
  de: "germany",
  ger: "germany",
  china: "china",
  китай: "china",
  cn: "china",
  warehouse: "warehouse",
  склад: "warehouse",
  transit: "transit",
  транзит: "transit",
  other: "other",
};

const CURRENCY_ALIASES: Record<string, string> = {
  "€": "EUR",
  eur: "EUR",
  euro: "EUR",
  $: "USD",
  usd: "USD",
  "¥": "CNY",
  cny: "CNY",
  юань: "CNY",
  yuan: "CNY",
  rmb: "CNY",
  rub: "RUB",
  "₽": "RUB",
  руб: "RUB",
  uzs: "UZS",
  сум: "UZS",
  som: "UZS",
};

export function parseWorkbook(
  buffer: ArrayBuffer | Buffer,
  options?: { sheetName?: string; mapping?: ColumnMapping },
): ParseResult {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = options?.sheetName ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    return {
      headers: [],
      detected: {},
      rows: [],
      errors: [{ rowIndex: 0, column: null, message: `Sheet not found: ${sheetName}` }],
      totalRows: 0,
    };
  }

  const json = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown as unknown[][];
  if (json.length === 0) {
    return { headers: [], detected: {}, rows: [], errors: [], totalRows: 0 };
  }

  const headerRow = (json[0] ?? []).map((v) => String(v ?? "").trim());
  const detected = detectMapping(headerRow);
  const mapping: ColumnMapping = { ...detected, ...(options?.mapping ?? {}) };

  const headerIndex = new Map<string, number>();
  headerRow.forEach((h, idx) => {
    if (h && !headerIndex.has(h)) headerIndex.set(h, idx);
  });

  const errors: ParseError[] = [];
  const rows: ParsedRow[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < json.length; i++) {
    const raw = json[i] ?? [];
    if (!raw.length || raw.every((v) => v === "" || v === null || v === undefined)) {
      continue; // skip empty rows
    }
    const rowIndex = i + 1; // 1-based row in spreadsheet
    const row = parseRow(raw, mapping, headerIndex, rowIndex, errors);
    if (!row) continue;

    const normalized = normalizeArticle(row.article);
    if (seen.has(normalized)) {
      errors.push({
        rowIndex,
        column: mapping.article ?? null,
        message: `Дублирующийся артикул в файле: ${row.article}`,
      });
      continue;
    }
    seen.add(normalized);
    rows.push(row);
  }

  return {
    headers: headerRow,
    detected,
    rows,
    errors,
    totalRows: json.length - 1,
  };
}

function parseRow(
  raw: unknown[],
  mapping: ColumnMapping,
  headerIndex: Map<string, number>,
  rowIndex: number,
  errors: ParseError[],
): ParsedRow | null {
  const get = (field: keyof ColumnMapping): unknown => {
    const headerName = mapping[field];
    if (!headerName) return undefined;
    const idx = headerIndex.get(headerName);
    if (idx === undefined) return undefined;
    return raw[idx];
  };

  const articleRaw = get("article");
  const article = String(articleRaw ?? "").trim();
  if (!article) {
    errors.push({
      rowIndex,
      column: mapping.article ?? null,
      message: "Артикул пустой",
    });
    return null;
  }

  const nameRaw = get("name");
  const name = String(nameRaw ?? "").trim();
  if (!name) {
    errors.push({
      rowIndex,
      column: mapping.name ?? null,
      message: "Название пустое",
    });
    return null;
  }

  const base_price = parseNumber(get("base_price"));
  if (base_price === null || base_price < 0) {
    errors.push({
      rowIndex,
      column: mapping.base_price ?? null,
      message: `Цена должна быть числом >= 0 (получено: ${formatVal(get("base_price"))})`,
    });
    return null;
  }

  const cost_price = parseNumber(get("cost_price"));

  const currencyRaw = get("base_currency");
  const base_currency =
    currencyRaw !== undefined && currencyRaw !== ""
      ? normalizeCurrency(String(currencyRaw))
      : null;
  if (currencyRaw !== undefined && currencyRaw !== "" && !base_currency) {
    errors.push({
      rowIndex,
      column: mapping.base_currency ?? null,
      message: `Неизвестная валюта: ${currencyRaw}`,
    });
  }

  const stock = parseNumber(get("stock")) ?? 0;
  const min_order = Math.max(1, Math.floor(parseNumber(get("min_order")) ?? 1));

  const sourceRaw = get("source");
  const source =
    sourceRaw !== undefined && sourceRaw !== ""
      ? normalizeSource(String(sourceRaw))
      : null;

  const lead_time = stringOrNull(get("lead_time"));
  const source_country = stringOrNull(get("source_country"));
  const brand = stringOrNull(get("brand"));
  const category = stringOrNull(get("category"));
  const applicability = stringOrNull(get("applicability"));
  const description = stringOrNull(get("description"));

  return {
    rowIndex,
    article,
    name,
    brand,
    category,
    base_price,
    base_currency,
    cost_price,
    stock: Math.max(0, Math.floor(stock)),
    lead_time,
    source,
    source_country,
    min_order,
    applicability,
    description,
  };
}

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/\s+/g, "").replace(/,/g, ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeCurrency(s: string): string | null {
  const key = s.trim().toLowerCase();
  if (CURRENCY_ALIASES[key]) return CURRENCY_ALIASES[key];
  const upper = s.trim().toUpperCase();
  return VALID_CURRENCIES.has(upper) ? upper : null;
}

function normalizeSource(s: string): string | null {
  const key = s.trim().toLowerCase();
  if (SOURCE_ALIASES[key]) return SOURCE_ALIASES[key];
  return VALID_SOURCES.has(key) ? key : null;
}

function stringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "пусто";
  return String(v);
}
