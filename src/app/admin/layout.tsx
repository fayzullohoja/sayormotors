import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AdminMobileNav } from "@/components/admin-mobile-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; role: "client" | "manager" | "admin" }>();

  if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Sayor Motors"
              width={130}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <nav className="space-y-1 p-3 text-sm">
          <SideLink href="/admin">Дашборд</SideLink>
          <SideLink href="/admin/requests">Заявки</SideLink>
          <SideLink href="/admin/vin">VIN-запросы</SideLink>
          <SideLink href="/admin/applications">B2B-заявки</SideLink>
          <SideLink href="/admin/clients">Клиенты</SideLink>
          <SideLink href="/admin/products">Товары</SideLink>
          <SideLink href="/admin/imports">Загрузка Excel</SideLink>
          <SideLink href="/admin/settings/currency">Курсы валют</SideLink>
          {profile.role === "admin" ? (
            <SideLink href="/admin/managers">Менеджеры</SideLink>
          ) : null}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <AdminMobileNav isAdmin={profile.role === "admin"} />
            <div className="text-sm font-medium text-muted-foreground">
              Админ-панель
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground md:inline">
              {profile.full_name || user.email} · {profile.role}
            </span>
            <Button asChild size="sm" variant="ghost">
              <Link href="/app">Кабинет клиента</Link>
            </Button>
            <form action="/auth/logout" method="post">
              <Button type="submit" size="sm" variant="ghost">
                Выйти
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function SideLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </Link>
  );
}
