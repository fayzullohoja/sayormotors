// Hand-rolled minimal Database type for the tables we touch.
// Replace with `supabase gen types typescript` output once migrations are applied.

export type Currency = "EUR" | "USD" | "CNY" | "RUB" | "UZS";
export type ProductSource = "germany" | "china" | "warehouse" | "transit" | "other";
export type UserRole = "client" | "manager" | "admin";
export type UserStatus = "pending" | "active" | "blocked";
export type RequestStatus =
  | "new"
  | "in_progress"
  | "awaiting_clarification"
  | "confirmed"
  | "partial"
  | "awaiting_payment"
  | "ordered"
  | "ready_for_shipment"
  | "completed"
  | "cancelled";
export type RequestItemStatus =
  | "pending"
  | "confirmed"
  | "partial"
  | "unavailable";
export type CompanyApplicationStatus = "pending" | "approved" | "rejected";
export type VinRequestStatus =
  | "new"
  | "in_progress"
  | "quoted"
  | "rejected"
  | "completed";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

type ProfileRow = {
  id: string;
  role: UserRole;
  status: UserStatus;
  full_name: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  company_id: string | null;
  internal_comment: string | null;
  created_at: string;
  updated_at: string;
};

type CompanyRow = {
  id: string;
  name: string;
  inn: string | null;
  country: string | null;
  city: string | null;
  legal_address: string | null;
  contact_person: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  email: string | null;
  client_type: string | null;
  pricing_group: string | null;
  discount_percent: number | null;
  default_currency: Currency;
  internal_comment: string | null;
  is_active: boolean;
  application_email: string | null;
  application_status: CompanyApplicationStatus;
  application_comment: string | null;
  created_at: string;
  updated_at: string;
};

type ProductRow = {
  id: string;
  article: string;
  article_normalized: string;
  name: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  applicability: string | null;
  base_price: number;
  base_currency: Currency;
  cost_price: number | null;
  cost_currency: Currency | null;
  stock: number;
  lead_time: string | null;
  source: ProductSource;
  source_country: string | null;
  min_order: number;
  photo_url: string | null;
  is_active: boolean;
  supplier_profile_id: string | null;
  last_imported_at: string | null;
  internal_comment: string | null;
  created_at: string;
  updated_at: string;
};

type SupplierProfileRow = {
  id: string;
  name: string;
  description: string | null;
  column_mapping: Json;
  default_currency: Currency;
  default_source: ProductSource;
  markup_percent: number;
  is_active: boolean;
  last_imported_at: string | null;
  created_at: string;
  updated_at: string;
};

type ExcelImportRow = {
  id: string;
  supplier_profile_id: string | null;
  uploaded_by: string | null;
  file_name: string;
  file_path: string | null;
  total_rows: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  errors: Json | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

type RequestRow = {
  id: string;
  number: number;
  company_id: string;
  created_by: string;
  assigned_manager_id: string | null;
  status: RequestStatus;
  display_currency: Currency;
  total_amount: number;
  contact_method: string | null;
  client_comment: string | null;
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  closed_at: string | null;
};

type RequestItemRow = {
  id: string;
  request_id: string;
  product_id: string | null;
  article_input: string;
  article_normalized: string;
  name_snapshot: string | null;
  brand_snapshot: string | null;
  qty_requested: number;
  qty_confirmed: number | null;
  price_at_request: number | null;
  price_confirmed: number | null;
  currency: Currency | null;
  status: RequestItemStatus;
  client_comment: string | null;
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
};

type RequestHistoryRow = {
  id: number;
  request_id: string;
  request_item_id: string | null;
  changed_by: string | null;
  event_type: string;
  payload: Json;
  created_at: string;
};

type VinRequestRow = {
  id: string;
  number: number;
  company_id: string;
  created_by: string;
  assigned_manager_id: string | null;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  what_needed: string;
  client_comment: string | null;
  manager_comment: string | null;
  photo_urls: string[];
  status: VinRequestStatus;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      companies: {
        Row: CompanyRow;
        Insert: Partial<CompanyRow> & { name: string };
        Update: Partial<CompanyRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Omit<Partial<ProductRow>, "article_normalized"> & {
          article: string;
          name: string;
          base_price: number;
        };
        Update: Omit<Partial<ProductRow>, "article_normalized">;
        Relationships: [];
      };
      supplier_profiles: {
        Row: SupplierProfileRow;
        Insert: Partial<SupplierProfileRow> & { name: string };
        Update: Partial<SupplierProfileRow>;
        Relationships: [];
      };
      excel_imports: {
        Row: ExcelImportRow;
        Insert: Partial<ExcelImportRow> & { file_name: string };
        Update: Partial<ExcelImportRow>;
        Relationships: [];
      };
      requests: {
        Row: RequestRow;
        Insert: Partial<RequestRow> & {
          company_id: string;
          created_by: string;
        };
        Update: Partial<RequestRow>;
        Relationships: [];
      };
      request_items: {
        Row: RequestItemRow;
        Insert: Omit<Partial<RequestItemRow>, "article_normalized"> & {
          request_id: string;
          article_input: string;
          qty_requested: number;
        };
        Update: Omit<Partial<RequestItemRow>, "article_normalized">;
        Relationships: [];
      };
      request_history: {
        Row: RequestHistoryRow;
        Insert: Partial<RequestHistoryRow> & {
          request_id: string;
          event_type: string;
        };
        Update: Partial<RequestHistoryRow>;
        Relationships: [];
      };
      vin_requests: {
        Row: VinRequestRow;
        Insert: Partial<VinRequestRow> & {
          company_id: string;
          created_by: string;
          vin: string;
          what_needed: string;
        };
        Update: Partial<VinRequestRow>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      submit_b2b_application: {
        Args: {
          payload: {
            company_name?: string;
            email?: string;
            inn?: string | null;
            country?: string | null;
            city?: string | null;
            contact_person?: string | null;
            phone?: string | null;
            telegram?: string | null;
            whatsapp?: string | null;
            client_type?: string | null;
            comment?: string | null;
          };
        };
        Returns: string;
      };
      normalize_article: {
        Args: { input: string };
        Returns: string;
      };
      current_user_role: {
        Args: { [_ in never]: never };
        Returns: UserRole;
      };
      current_user_status: {
        Args: { [_ in never]: never };
        Returns: UserStatus;
      };
      is_staff: {
        Args: { [_ in never]: never };
        Returns: boolean;
      };
      is_admin: {
        Args: { [_ in never]: never };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      currency_code: Currency;
      product_source: ProductSource;
      request_status: RequestStatus;
      request_item_status: RequestItemStatus;
      vin_request_status: VinRequestStatus;
      company_application_status: CompanyApplicationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
