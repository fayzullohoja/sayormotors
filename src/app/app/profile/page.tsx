import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./form";
import { TelegramLink } from "./telegram-link";

export const metadata: Metadata = {
  title: "Профиль",
};

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  status: "pending" | "active" | "blocked";
  company_id: string | null;
  telegram_chat_id: number | null;
};

type CompanyRow = {
  name: string;
  inn: string | null;
  city: string | null;
  country: string | null;
  pricing_group: string | null;
  discount_percent: number | null;
  default_currency: string | null;
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, telegram, whatsapp, status, company_id, telegram_chat_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  let company: CompanyRow | null = null;
  if (profile?.company_id) {
    const { data } = await supabase
      .from("companies")
      .select(
        "name, inn, city, country, pricing_group, discount_percent, default_currency",
      )
      .eq("id", profile.company_id)
      .maybeSingle<CompanyRow>();
    company = data ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Профиль</h1>
        <p className="mt-2 text-muted-foreground">
          Контактные данные и реквизиты компании.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Контактные данные</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm
                email={user.email ?? ""}
                defaults={{
                  full_name: profile?.full_name ?? "",
                  phone: profile?.phone ?? "",
                  telegram: profile?.telegram ?? "",
                  whatsapp: profile?.whatsapp ?? "",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Уведомления в Telegram</CardTitle>
            </CardHeader>
            <CardContent>
              <TelegramLink
                linked={!!profile?.telegram_chat_id}
                username={profile?.telegram ?? null}
                botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? null}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Компания</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {company ? (
              <>
                <Field label="Название" value={company.name} />
                <Field label="ИНН" value={company.inn} />
                <Field
                  label="Город"
                  value={[company.city, company.country].filter(Boolean).join(", ")}
                />
                <Field
                  label="Группа цен"
                  value={company.pricing_group ?? "default"}
                />
                <Field
                  label="Скидка"
                  value={
                    company.discount_percent
                      ? `${company.discount_percent}%`
                      : "0%"
                  }
                />
                <Field
                  label="Валюта"
                  value={company.default_currency ?? "EUR"}
                />
                <p className="text-xs text-muted-foreground">
                  Реквизиты компании меняет менеджер. Если что-то нужно поправить —
                  напишите ему.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Компания не привязана. Свяжитесь с менеджером.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

declare global {
  // Allow reading NEXT_PUBLIC_TELEGRAM_BOT_USERNAME in server components without TS complaints
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?: string;
    }
  }
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}
