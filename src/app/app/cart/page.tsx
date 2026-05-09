import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  title: "Корзина",
};

export default async function CartPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, telegram, whatsapp, status, company_id")
    .eq("id", user.id)
    .maybeSingle();

  let companyName: string | null = null;
  if (profile?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .maybeSingle();
    companyName = company?.name ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Корзина</h1>
        <p className="mt-2 text-muted-foreground">
          Сформируйте заявку — менеджер подтвердит наличие, цены и срок поставки.
        </p>
      </div>
      <CartClient
        contact={{
          email: user.email ?? "",
          companyName,
          fullName: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          telegram: profile?.telegram ?? "",
          whatsapp: profile?.whatsapp ?? "",
        }}
        canSubmit={profile?.status === "active"}
      />
    </div>
  );
}
