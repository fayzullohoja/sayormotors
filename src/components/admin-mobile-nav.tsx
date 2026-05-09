"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const ALL_LINKS = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/vin", label: "VIN-запросы" },
  { href: "/admin/applications", label: "B2B-заявки" },
  { href: "/admin/clients", label: "Клиенты" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/imports", label: "Загрузка Excel" },
  { href: "/admin/settings/currency", label: "Курсы валют" },
];

export function AdminMobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const links = isAdmin
    ? [...ALL_LINKS, { href: "/admin/managers", label: "Менеджеры" }]
    : ALL_LINKS;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Меню"
          className="md:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Админ-панель</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
          <div className="my-2 border-t" />
          <Link
            href="/app"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            Кабинет клиента
          </Link>
          <form
            action="/auth/logout"
            method="post"
            className="mt-3 border-t pt-3"
          >
            <Button type="submit" size="sm" variant="ghost" className="w-full justify-start">
              Выйти
            </Button>
          </form>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
