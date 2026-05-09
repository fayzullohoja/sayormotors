"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseWorkbook } from "@/lib/excel/parse";
import type {
  ColumnMapping,
  ParseResult,
  ParsedRow,
} from "@/lib/excel/types";
import type { Currency, ProductSource } from "@/lib/supabase/database.types";
import { normalizeArticle } from "@/lib/article";

async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: "client" | "manager" | "admin" }>();
  if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
    throw new Error("forbidden");
  }
  return { userId: user.id };
}

export type ParseActionResult =
  | { ok: true; fileName: string; result: ParseResult }
  | { ok: false; error: string };

export async function parseExcelAction(
  _prev: ParseActionResult | null,
  formData: FormData,
): Promise<ParseActionResult> {
  try {
    await requireStaff();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Файл не выбран" };
  }
  if (file.size > 50 * 1024 * 1024) {
    return { ok: false, error: "Файл больше 50 МБ" };
  }

  const buffer = await file.arrayBuffer();
  let result: ParseResult;
  try {
    result = parseWorkbook(buffer);
  } catch (e) {
    return { ok: false, error: `Не удалось прочитать Excel: ${(e as Error).message}` };
  }

  return { ok: true, fileName: file.name, result };
}

export type ApplySummary = {
  importId: string;
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ rowIndex: number; message: string }>;
};

export type ApplyActionResult =
  | { ok: true; summary: ApplySummary }
  | { ok: false; error: string };

export async function applyImportAction(args: {
  fileName: string;
  rows: ParsedRow[];
  supplierProfileId: string | null;
  defaults: { currency: string; source: string };
}): Promise<ApplyActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const admin = createSupabaseAdminClient();

  const { data: importRow, error: importInsertErr } = await admin
    .from("excel_imports")
    .insert({
      supplier_profile_id: args.supplierProfileId,
      uploaded_by: userId,
      file_name: args.fileName,
      total_rows: args.rows.length,
      status: "processing",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();
  if (importInsertErr || !importRow) {
    return { ok: false, error: importInsertErr?.message ?? "import_create_failed" };
  }
  const importId = importRow.id;

  const summary: ApplySummary = {
    importId,
    total: args.rows.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  // Pre-check which articles already exist to compute create/update split.
  const normalizedArticles = args.rows.map((r) => normalizeArticle(r.article));
  const existingSet = new Set<string>();
  // Chunk to keep IN clauses bounded.
  for (let i = 0; i < normalizedArticles.length; i += 1000) {
    const chunk = normalizedArticles.slice(i, i + 1000);
    const { data: existing } = await admin
      .from("products")
      .select("article_normalized")
      .in("article_normalized", chunk)
      .returns<{ article_normalized: string }[]>();
    if (existing) {
      for (const row of existing) existingSet.add(row.article_normalized);
    }
  }

  const now = new Date().toISOString();
  const BATCH_SIZE = 500;

  for (let i = 0; i < args.rows.length; i += BATCH_SIZE) {
    const slice = args.rows.slice(i, i + BATCH_SIZE);
    const payload = slice.map((r) => ({
      article: r.article,
      name: r.name,
      brand: r.brand,
      category: r.category,
      description: r.description,
      applicability: r.applicability,
      base_price: r.base_price ?? 0,
      base_currency: (r.base_currency ?? args.defaults.currency) as Currency,
      cost_price: r.cost_price,
      stock: r.stock,
      lead_time: r.lead_time,
      source: (r.source ?? args.defaults.source) as ProductSource,
      source_country: r.source_country,
      min_order: r.min_order,
      supplier_profile_id: args.supplierProfileId,
      last_imported_at: now,
      is_active: true,
    }));

    const { error: upsertErr } = await admin
      .from("products")
      .upsert(payload, { onConflict: "article_normalized" });

    if (upsertErr) {
      summary.failed += slice.length;
      summary.errors.push({
        rowIndex: slice[0]?.rowIndex ?? -1,
        message: `Партия ${i / BATCH_SIZE + 1}: ${upsertErr.message}`,
      });
    } else {
      for (const r of slice) {
        if (existingSet.has(normalizeArticle(r.article))) summary.updated++;
        else summary.created++;
      }
    }
  }

  // Update supplier profile last_imported_at if linked
  if (args.supplierProfileId) {
    await admin
      .from("supplier_profiles")
      .update({ last_imported_at: now })
      .eq("id", args.supplierProfileId);
  }

  await admin
    .from("excel_imports")
    .update({
      created_count: summary.created,
      updated_count: summary.updated,
      error_count: summary.failed,
      errors: summary.errors,
      status: summary.failed > 0 ? "completed_with_errors" : "completed",
      finished_at: new Date().toISOString(),
    })
    .eq("id", importId);

  revalidatePath("/admin/imports");
  revalidatePath("/admin/products");
  return { ok: true, summary };
}
