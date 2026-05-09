export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      companies: {
        Row: {
          application_comment: string | null
          application_email: string | null
          application_status: Database["public"]["Enums"]["company_application_status"]
          city: string | null
          client_type: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          default_currency: Database["public"]["Enums"]["currency_code"]
          discount_percent: number
          email: string | null
          id: string
          inn: string | null
          internal_comment: string | null
          is_active: boolean
          legal_address: string | null
          name: string
          phone: string | null
          pricing_group: string | null
          telegram: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          application_comment?: string | null
          application_email?: string | null
          application_status?: Database["public"]["Enums"]["company_application_status"]
          city?: string | null
          client_type?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          discount_percent?: number
          email?: string | null
          id?: string
          inn?: string | null
          internal_comment?: string | null
          is_active?: boolean
          legal_address?: string | null
          name: string
          phone?: string | null
          pricing_group?: string | null
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          application_comment?: string | null
          application_email?: string | null
          application_status?: Database["public"]["Enums"]["company_application_status"]
          city?: string | null
          client_type?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          discount_percent?: number
          email?: string | null
          id?: string
          inn?: string | null
          internal_comment?: string | null
          is_active?: boolean
          legal_address?: string | null
          name?: string
          phone?: string | null
          pricing_group?: string | null
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          code: Database["public"]["Enums"]["currency_code"]
          rate_to_eur: number
          updated_at: string
        }
        Insert: {
          code: Database["public"]["Enums"]["currency_code"]
          rate_to_eur: number
          updated_at?: string
        }
        Update: {
          code?: Database["public"]["Enums"]["currency_code"]
          rate_to_eur?: number
          updated_at?: string
        }
        Relationships: []
      }
      excel_imports: {
        Row: {
          created_at: string
          created_count: number
          error_count: number
          errors: Json | null
          file_name: string
          file_path: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          status: string
          supplier_profile_id: string | null
          total_rows: number
          updated_count: number
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          created_count?: number
          error_count?: number
          errors?: Json | null
          file_name: string
          file_path?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          supplier_profile_id?: string | null
          total_rows?: number
          updated_count?: number
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          created_count?: number
          error_count?: number
          errors?: Json | null
          file_name?: string
          file_path?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          supplier_profile_id?: string | null
          total_rows?: number
          updated_count?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "excel_imports_supplier_profile_id_fkey"
            columns: ["supplier_profile_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "excel_imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          applicability: string | null
          article: string
          article_normalized: string | null
          base_currency: Database["public"]["Enums"]["currency_code"]
          base_price: number
          brand: string | null
          category: string | null
          cost_currency: Database["public"]["Enums"]["currency_code"] | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          internal_comment: string | null
          is_active: boolean
          last_imported_at: string | null
          lead_time: string | null
          min_order: number
          name: string
          photo_url: string | null
          source: Database["public"]["Enums"]["product_source"]
          source_country: string | null
          stock: number
          supplier_profile_id: string | null
          updated_at: string
        }
        Insert: {
          applicability?: string | null
          article: string
          article_normalized?: string | null
          base_currency?: Database["public"]["Enums"]["currency_code"]
          base_price: number
          brand?: string | null
          category?: string | null
          cost_currency?: Database["public"]["Enums"]["currency_code"] | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          internal_comment?: string | null
          is_active?: boolean
          last_imported_at?: string | null
          lead_time?: string | null
          min_order?: number
          name: string
          photo_url?: string | null
          source?: Database["public"]["Enums"]["product_source"]
          source_country?: string | null
          stock?: number
          supplier_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          applicability?: string | null
          article?: string
          article_normalized?: string | null
          base_currency?: Database["public"]["Enums"]["currency_code"]
          base_price?: number
          brand?: string | null
          category?: string | null
          cost_currency?: Database["public"]["Enums"]["currency_code"] | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          internal_comment?: string | null
          is_active?: boolean
          last_imported_at?: string | null
          lead_time?: string | null
          min_order?: number
          name?: string
          photo_url?: string | null
          source?: Database["public"]["Enums"]["product_source"]
          source_country?: string | null
          stock?: number
          supplier_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_profile_id_fkey"
            columns: ["supplier_profile_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          internal_comment: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          telegram: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          internal_comment?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          internal_comment?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      request_history: {
        Row: {
          changed_by: string | null
          created_at: string
          event_type: string
          id: number
          payload: Json
          request_id: string
          request_item_id: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          event_type: string
          id?: number
          payload?: Json
          request_id: string
          request_item_id?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          event_type?: string
          id?: number
          payload?: Json
          request_id?: string
          request_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_history_request_item_id_fkey"
            columns: ["request_item_id"]
            isOneToOne: false
            referencedRelation: "request_items"
            referencedColumns: ["id"]
          },
        ]
      }
      request_items: {
        Row: {
          article_input: string
          article_normalized: string | null
          brand_snapshot: string | null
          client_comment: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"] | null
          id: string
          manager_comment: string | null
          name_snapshot: string | null
          price_at_request: number | null
          price_confirmed: number | null
          product_id: string | null
          qty_confirmed: number | null
          qty_requested: number
          request_id: string
          status: Database["public"]["Enums"]["request_item_status"]
          updated_at: string
        }
        Insert: {
          article_input: string
          article_normalized?: string | null
          brand_snapshot?: string | null
          client_comment?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"] | null
          id?: string
          manager_comment?: string | null
          name_snapshot?: string | null
          price_at_request?: number | null
          price_confirmed?: number | null
          product_id?: string | null
          qty_confirmed?: number | null
          qty_requested: number
          request_id: string
          status?: Database["public"]["Enums"]["request_item_status"]
          updated_at?: string
        }
        Update: {
          article_input?: string
          article_normalized?: string | null
          brand_snapshot?: string | null
          client_comment?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"] | null
          id?: string
          manager_comment?: string | null
          name_snapshot?: string | null
          price_at_request?: number | null
          price_confirmed?: number | null
          product_id?: string | null
          qty_confirmed?: number | null
          qty_requested?: number
          request_id?: string
          status?: Database["public"]["Enums"]["request_item_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          assigned_manager_id: string | null
          client_comment: string | null
          closed_at: string | null
          company_id: string
          confirmed_at: string | null
          contact_method: string | null
          created_at: string
          created_by: string
          display_currency: Database["public"]["Enums"]["currency_code"]
          id: string
          manager_comment: string | null
          number: number
          status: Database["public"]["Enums"]["request_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          assigned_manager_id?: string | null
          client_comment?: string | null
          closed_at?: string | null
          company_id: string
          confirmed_at?: string | null
          contact_method?: string | null
          created_at?: string
          created_by: string
          display_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          manager_comment?: string | null
          number?: number
          status?: Database["public"]["Enums"]["request_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          assigned_manager_id?: string | null
          client_comment?: string | null
          closed_at?: string | null
          company_id?: string
          confirmed_at?: string | null
          contact_method?: string | null
          created_at?: string
          created_by?: string
          display_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          manager_comment?: string | null
          number?: number
          status?: Database["public"]["Enums"]["request_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_manager_id_fkey"
            columns: ["assigned_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_profiles: {
        Row: {
          column_mapping: Json
          created_at: string
          default_currency: Database["public"]["Enums"]["currency_code"]
          default_source: Database["public"]["Enums"]["product_source"]
          description: string | null
          id: string
          is_active: boolean
          last_imported_at: string | null
          markup_percent: number
          name: string
          updated_at: string
        }
        Insert: {
          column_mapping?: Json
          created_at?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          default_source?: Database["public"]["Enums"]["product_source"]
          description?: string | null
          id?: string
          is_active?: boolean
          last_imported_at?: string | null
          markup_percent?: number
          name: string
          updated_at?: string
        }
        Update: {
          column_mapping?: Json
          created_at?: string
          default_currency?: Database["public"]["Enums"]["currency_code"]
          default_source?: Database["public"]["Enums"]["product_source"]
          description?: string | null
          id?: string
          is_active?: boolean
          last_imported_at?: string | null
          markup_percent?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      vin_requests: {
        Row: {
          assigned_manager_id: string | null
          client_comment: string | null
          company_id: string
          created_at: string
          created_by: string
          id: string
          make: string | null
          manager_comment: string | null
          model: string | null
          number: number
          photo_urls: string[]
          status: Database["public"]["Enums"]["vin_request_status"]
          updated_at: string
          vin: string
          what_needed: string
          year: number | null
        }
        Insert: {
          assigned_manager_id?: string | null
          client_comment?: string | null
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          make?: string | null
          manager_comment?: string | null
          model?: string | null
          number?: number
          photo_urls?: string[]
          status?: Database["public"]["Enums"]["vin_request_status"]
          updated_at?: string
          vin: string
          what_needed: string
          year?: number | null
        }
        Update: {
          assigned_manager_id?: string | null
          client_comment?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          make?: string | null
          manager_comment?: string | null
          model?: string | null
          number?: number
          photo_urls?: string[]
          status?: Database["public"]["Enums"]["vin_request_status"]
          updated_at?: string
          vin?: string
          what_needed?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vin_requests_assigned_manager_id_fkey"
            columns: ["assigned_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vin_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vin_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_user_status: {
        Args: never
        Returns: Database["public"]["Enums"]["user_status"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      normalize_article: { Args: { input: string }; Returns: string }
      search_products: {
        Args: { q: string; result_limit?: number }
        Returns: {
          applicability: string | null
          article: string
          article_normalized: string | null
          base_currency: Database["public"]["Enums"]["currency_code"]
          base_price: number
          brand: string | null
          category: string | null
          cost_currency: Database["public"]["Enums"]["currency_code"] | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          internal_comment: string | null
          is_active: boolean
          last_imported_at: string | null
          lead_time: string | null
          min_order: number
          name: string
          photo_url: string | null
          source: Database["public"]["Enums"]["product_source"]
          source_country: string | null
          stock: number
          supplier_profile_id: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      set_user_role: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_b2b_application: { Args: { payload: Json }; Returns: string }
    }
    Enums: {
      company_application_status: "pending" | "approved" | "rejected"
      currency_code: "EUR" | "USD" | "CNY" | "RUB" | "UZS"
      product_source: "germany" | "china" | "warehouse" | "transit" | "other"
      request_item_status: "pending" | "confirmed" | "partial" | "unavailable"
      request_status:
        | "new"
        | "in_progress"
        | "awaiting_clarification"
        | "confirmed"
        | "partial"
        | "awaiting_payment"
        | "ordered"
        | "ready_for_shipment"
        | "completed"
        | "cancelled"
      user_role: "client" | "manager" | "admin"
      user_status: "pending" | "active" | "blocked"
      vin_request_status:
        | "new"
        | "in_progress"
        | "quoted"
        | "rejected"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      company_application_status: ["pending", "approved", "rejected"],
      currency_code: ["EUR", "USD", "CNY", "RUB", "UZS"],
      product_source: ["germany", "china", "warehouse", "transit", "other"],
      request_item_status: ["pending", "confirmed", "partial", "unavailable"],
      request_status: [
        "new",
        "in_progress",
        "awaiting_clarification",
        "confirmed",
        "partial",
        "awaiting_payment",
        "ordered",
        "ready_for_shipment",
        "completed",
        "cancelled",
      ],
      user_role: ["client", "manager", "admin"],
      user_status: ["pending", "active", "blocked"],
      vin_request_status: [
        "new",
        "in_progress",
        "quoted",
        "rejected",
        "completed",
      ],
    },
  },
} as const
