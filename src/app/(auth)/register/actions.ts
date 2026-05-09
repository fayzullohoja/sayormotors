"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RegisterState = {
  ok?: boolean;
  error?: string;
  values?: Record<string, string>;
};

const REQUIRED_FIELDS = ["company_name", "email", "contact_person", "phone"] as const;

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    values[k] = String(v ?? "").trim();
  }

  for (const field of REQUIRED_FIELDS) {
    if (!values[field]) {
      return {
        error: "Заполните обязательные поля: компания, email, контактное лицо, телефон",
        values,
      };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_b2b_application", {
    payload: {
      company_name: values.company_name,
      email: values.email,
      inn: values.inn,
      country: values.country,
      city: values.city,
      contact_person: values.contact_person,
      phone: values.phone,
      telegram: values.telegram,
      whatsapp: values.whatsapp,
      client_type: values.client_type,
      comment: values.comment,
    },
  });

  if (error) {
    if (error.message.includes("application_already_pending")) {
      return {
        error: "Заявка с этим email уже на рассмотрении. Менеджер свяжется с вами.",
        values,
      };
    }
    if (error.message.includes("invalid_email")) {
      return { error: "Неверный формат email", values };
    }
    return { error: error.message, values };
  }

  return { ok: true };
}
