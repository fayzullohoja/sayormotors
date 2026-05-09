import type {
  RequestStatus,
  RequestItemStatus,
} from "@/lib/supabase/database.types";

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  new: "Новая",
  in_progress: "В обработке",
  awaiting_clarification: "Ожидает уточнения",
  confirmed: "Подтверждена",
  partial: "Частично",
  awaiting_payment: "Ожидает оплаты",
  ordered: "Заказана у поставщика",
  ready_for_shipment: "К отгрузке",
  completed: "Завершена",
  cancelled: "Отменена",
};

export const REQUEST_STATUS_VARIANT: Record<
  RequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "secondary",
  in_progress: "default",
  awaiting_clarification: "outline",
  confirmed: "default",
  partial: "secondary",
  awaiting_payment: "outline",
  ordered: "default",
  ready_for_shipment: "default",
  completed: "default",
  cancelled: "destructive",
};

export const REQUEST_ITEM_STATUS_LABEL: Record<RequestItemStatus, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждено",
  partial: "Частично",
  unavailable: "Нет в наличии",
};

export const REQUEST_ITEM_STATUS_VARIANT: Record<
  RequestItemStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  partial: "outline",
  unavailable: "destructive",
};
