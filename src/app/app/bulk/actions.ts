"use server";

import * as XLSX from "xlsx";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeArticle } from "@/lib/article";
import { detectMapping } from "@/lib/excel/headers";
import { applyDiscount } from "@/lib/pricing";

export type BulkRow = {
  input: string;
  normalized: string;
  qty: number;
  product:
    | {
        id: string;
        article: string;
        name: string;
        brand: string | null;
        base_price: number;
        base_currency: string;
        display_price: number;
        stock: number;
        lead_time: string | null;
        source: string;
      }
    | null;
};

export type BulkResult = {
  ok: boolean;
  rows: BulkRow[];
  total: number;
  found: number;
  missing: number;
  error?: string;
};

const MAX_INPUTS = 200;

export async function bulkCheckAction(formData: FormData): Promise<BulkResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthorized", rows: [], total: 0, found: 0, missing: 0 };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("status, company_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.status !== "active") {
    return {
      ok: false,
      error: "Доступ к каталогу появится после одобрения аккаунта",
      rows: [],
      total: 0,
      found: 0,
      missing: 0,
    };
  }
  let discount = 0;
  if (profile.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("discount_percent")
      .eq("id", profile.company_id)
      .maybeSingle();
    discount = company?.discount_percent ?? 0;
  }

  const file = formData.get("file");
  const text = String(formData.get("text") ?? "");
  const inputs: { input: string; qty: number }[] = [];

  if (file instanceof File && file.size > 0) {
    if (file.size > 20 * 1024 * 1024) {
      return { ok: false, error: "Файл больше 20 МБ", rows: [], total: 0, found: 0, missing: 0 };
    }
    const buffer = await file.arrayBuffer();
    try {
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: true,
      }) as unknown as unknown[][];
      if (json.length > 0) {
        const headerRow = (json[0] ?? []).map((v) => String(v ?? "").trim());
        const detected = detectMapping(headerRow);
        const articleCol = detected.article;
        const qtyCol = detected.stock; // best-guess; clients sometimes paste qty in stock column
        let articleIdx = headerRow.indexOf(articleCol ?? "");
        if (articleIdx < 0) articleIdx = 0; // fallback to first column
        const qtyIdx = qtyCol ? headerRow.indexOf(qtyCol) : -1;
        for (let i = 1; i < json.length; i++) {
          const raw = json[i] ?? [];
          const article = String(raw[articleIdx] ?? "").trim();
          if (!article) continue;
          const qty = qtyIdx >= 0 ? Math.max(1, Math.floor(Number(raw[qtyIdx]) || 1)) : 1;
          inputs.push({ input: article, qty });
          if (inputs.length >= MAX_INPUTS) break;
        }
      }
    } catch (e) {
      return {
        ok: false,
        error: `Не удалось прочитать Excel: ${(e as Error).message}`,
        rows: [],
        total: 0,
        found: 0,
        missing: 0,
      };
    }
  } else if (text.trim()) {
    for (const line of text.split(/[\n,;]/g)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // line could be "34116859066 5" or "34116859066;5" or just "34116859066"
      const parts = trimmed.split(/[\s\t]+/);
      const article = parts[0];
      const qty = parts[1] ? Math.max(1, parseInt(parts[1], 10) || 1) : 1;
      inputs.push({ input: article, qty });
      if (inputs.length >= MAX_INPUTS) break;
    }
  }

  if (inputs.length === 0) {
    return {
      ok: false,
      error: "Не найдено ни одного артикула",
      rows: [],
      total: 0,
      found: 0,
      missing: 0,
    };
  }

  const normalizedToInput = new Map<string, { input: string; qty: number }>();
  for (const inp of inputs) {
    const norm = normalizeArticle(inp.input);
    if (norm && !normalizedToInput.has(norm)) {
      normalizedToInput.set(norm, inp);
    }
  }

  const normalizedKeys = Array.from(normalizedToInput.keys());
  const productMap = new Map<
    string,
    {
      id: string;
      article: string;
      name: string;
      brand: string | null;
      base_price: number;
      base_currency: string;
      stock: number;
      lead_time: string | null;
      source: string;
    }
  >();
  for (let i = 0; i < normalizedKeys.length; i += 200) {
    const chunk = normalizedKeys.slice(i, i + 200);
    const { data } = await supabase
      .from("products")
      .select(
        "id, article, article_normalized, name, brand, base_price, base_currency, stock, lead_time, source",
      )
      .in("article_normalized", chunk)
      .eq("is_active", true)
      .returns<
        {
          id: string;
          article: string;
          article_normalized: string;
          name: string;
          brand: string | null;
          base_price: number;
          base_currency: string;
          stock: number;
          lead_time: string | null;
          source: string;
        }[]
      >();
    if (data) {
      for (const p of data) productMap.set(p.article_normalized, p);
    }
  }

  const rows: BulkRow[] = inputs.map((inp) => {
    const norm = normalizeArticle(inp.input);
    const p = norm ? productMap.get(norm) : undefined;
    if (!p) {
      return { input: inp.input, normalized: norm, qty: inp.qty, product: null };
    }
    return {
      input: inp.input,
      normalized: norm,
      qty: inp.qty,
      product: {
        id: p.id,
        article: p.article,
        name: p.name,
        brand: p.brand,
        base_price: p.base_price,
        base_currency: p.base_currency,
        display_price: applyDiscount(p.base_price, discount),
        stock: p.stock,
        lead_time: p.lead_time,
        source: p.source,
      },
    };
  });

  const found = rows.filter((r) => r.product).length;
  return {
    ok: true,
    rows,
    total: rows.length,
    found,
    missing: rows.length - found,
  };
}
