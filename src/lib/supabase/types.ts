import type { Database } from "./database.types";

export type { Database };

export type Currency = Database["public"]["Enums"]["currency_code"];
export type ProductSource = Database["public"]["Enums"]["product_source"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type UserStatus = Database["public"]["Enums"]["user_status"];
export type RequestStatus = Database["public"]["Enums"]["request_status"];
export type RequestItemStatus =
  Database["public"]["Enums"]["request_item_status"];
export type VinRequestStatus =
  Database["public"]["Enums"]["vin_request_status"];
export type CompanyApplicationStatus =
  Database["public"]["Enums"]["company_application_status"];
