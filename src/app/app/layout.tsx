import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/cart-badge";
import { ClientMobileNav } from "@/components/client-mobile-nav";

export default async function ClientAppLayout({
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
    .select("full_name, role, status, company_id")
    .eq("id", user.id)
    .maybeSingle<{
      full_name: string | null;
      role: "client" | "manager" | "admin";
      status: "pending" | "active" | "blocked";
      company_id: string | null;
    }>();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 md:gap-6">
            <ClientMobileNav
              staffLink={
                profile?.role === "manager" || profile?.role === "admin"
                  ? { href: "/admin", label: "Открыть админку" }
                  : undefined
              }
            />
            <Link href="/app" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Sayor Motors"
                width={130}
                height={32}
                priority
                className="h-8 w-auto"
              />
            </Link>
            <nav className="hidden items-center gap-5 text-sm md:flex">
              <NavLink href="/app">Главная</NavLink>
              <NavLink href="/app/search">Поиск</NavLink>
              <NavLink href="/app/bulk">Массовая проверка</NavLink>
              <NavLink href="/app/cart">
                Корзина
                <CartBadge />
              </NavLink>
              <NavLink href="/app/requests">Мои заявки</NavLink>
              <NavLink href="/app/profile">Профиль</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground md:inline">
              {profile?.full_name || user.email}
            </span>
            {profile?.role === "manager" || profile?.role === "admin" ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Админка</Link>
              </Button>
            ) : null}
            <form action="/auth/logout" method="post">
              <Button type="submit" size="sm" variant="ghost">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>
      {profile?.status !== "active" ? (
        <div className="border-b bg-amber-50 text-amber-900">
          <div className="mx-auto max-w-7xl px-4 py-3 text-sm sm:px-6">
            {profile?.status === "blocked" ? (
              <>Ваш аккаунт заблокирован. Свяжитесь с менеджером.</>
            ) : (
              <>
                Аккаунт ожидает одобрения. Цены и наличие появятся после проверки
                менеджером.
              </>
            )}
          </div>
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}
