import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VinManageForm } from "./manage-form";
import type { VinRequestStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "VIN-запрос",
};

const STATUS_LABEL: Record<VinRequestStatus, string> = {
  new: "Новый",
  in_progress: "В обработке",
  quoted: "Подобрано",
  rejected: "Отклонён",
  completed: "Завершён",
};

const STATUS_VARIANT: Record<
  VinRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "secondary",
  in_progress: "default",
  quoted: "outline",
  rejected: "destructive",
  completed: "default",
};

type VinRow = {
  id: string;
  number: number;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  what_needed: string;
  client_comment: string | null;
  manager_comment: string | null;
  status: VinRequestStatus;
  photo_urls: string[];
  assigned_manager_id: string | null;
  created_at: string;
  company: {
    name: string;
    contact_person: string | null;
    phone: string | null;
    telegram: string | null;
    whatsapp: string | null;
    email: string | null;
  } | null;
  creator: { full_name: string | null } | null;
};

export default async function AdminVinDetailPage({
  params,
}: PageProps<"/admin/vin/[id]">) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: vin } = await supabase
    .from("vin_requests")
    .select(
      "id, number, vin, make, model, year, what_needed, client_comment, manager_comment, status, photo_urls, assigned_manager_id, created_at, company:companies(name,contact_person,phone,telegram,whatsapp,email), creator:profiles!vin_requests_created_by_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle<VinRow>();
  if (!vin) notFound();

  // Generate signed URLs for photos (1 hour expiry)
  const signedUrls: Array<{ path: string; url: string }> = [];
  if (vin.photo_urls && vin.photo_urls.length > 0) {
    const admin = createSupabaseAdminClient();
    for (const path of vin.photo_urls) {
      const { data } = await admin.storage
        .from("vin-photos")
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        signedUrls.push({ path, url: data.signedUrl });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link href="/admin/vin" className="hover:underline">
            VIN-запросы
          </Link>{" "}
          / №{vin.number}
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              VIN-запрос №{vin.number}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {vin.company?.name} · {new Date(vin.created_at).toLocaleString("ru")}
              {vin.creator?.full_name ? ` · ${vin.creator.full_name}` : ""}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[vin.status]}>
            {STATUS_LABEL[vin.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Автомобиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="VIN" value={vin.vin} mono />
            <Field
              label="Марка / модель / год"
              value={
                [vin.make, vin.model, vin.year ?? ""]
                  .filter(Boolean)
                  .join(" ") || "—"
              }
            />
            <div className="border-t pt-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Что нужно
              </div>
              <p className="mt-1 whitespace-pre-wrap">{vin.what_needed}</p>
            </div>
            {vin.client_comment ? (
              <div className="border-t pt-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Комментарий клиента
                </div>
                <p className="mt-1 whitespace-pre-wrap">{vin.client_comment}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Контакт</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="Компания" value={vin.company?.name ?? "—"} />
            <Field
              label="Контактное лицо"
              value={vin.company?.contact_person ?? "—"}
            />
            <Field label="Телефон" value={vin.company?.phone ?? "—"} />
            <Field label="Telegram" value={vin.company?.telegram ?? "—"} />
            <Field label="WhatsApp" value={vin.company?.whatsapp ?? "—"} />
            <Field label="Email" value={vin.company?.email ?? "—"} />
          </CardContent>
        </Card>
      </div>

      {signedUrls.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Фото ({signedUrls.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {signedUrls.map((p) => (
                <a
                  key={p.path}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-md border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt="VIN photo"
                    className="aspect-square w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Обработка</CardTitle>
        </CardHeader>
        <CardContent>
          <VinManageForm
            id={vin.id}
            status={vin.status}
            managerComment={vin.manager_comment ?? ""}
            assigned={!!vin.assigned_manager_id}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin/vin">Назад к списку</Link>
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
