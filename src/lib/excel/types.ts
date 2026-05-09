export type CanonicalField =
  | "article"
  | "name"
  | "brand"
  | "category"
  | "base_price"
  | "base_currency"
  | "cost_price"
  | "stock"
  | "lead_time"
  | "source"
  | "source_country"
  | "min_order"
  | "applicability"
  | "description";

export type ColumnMapping = Partial<Record<CanonicalField, string>>;

export type ParsedRow = {
  rowIndex: number; // 1-based, including header row
  article: string;
  name: string;
  brand: string | null;
  category: string | null;
  base_price: number | null;
  base_currency: string | null;
  cost_price: number | null;
  stock: number;
  lead_time: string | null;
  source: string | null;
  source_country: string | null;
  min_order: number;
  applicability: string | null;
  description: string | null;
};

export type ParseError = {
  rowIndex: number;
  column: string | null;
  message: string;
};

export type ParseResult = {
  headers: string[]; // raw header strings, in order
  detected: ColumnMapping; // best-guess mapping (canonical -> header)
  rows: ParsedRow[];
  errors: ParseError[];
  totalRows: number;
};
