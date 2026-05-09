/**
 * Mirror of the SQL `public.normalize_article(text)` function.
 * Strips all non-alphanumeric, uppercases the rest.
 * Use for client-side preview; the database is the source of truth.
 */
export function normalizeArticle(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}
