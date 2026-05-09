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
import { CartBadge } from "@/components/cart-badge";

const LINKS = [
  { href: "/app", label: "Главная" },
  { href: "/app/search", label: "Поиск" },
  { href: "/app/bulk", label: "Массовая проверка" },
  { href: "/app/cart", label: "Корзина", showCart: true },
  { href: "/app/vin", label: "VIN-запрос" },
  { href: "/app/requests", label: "Мои заявки" },
  { href: "/app/profile", label: "Профиль" },
];

export function ClientMobileNav({
  staffLink,
}: {
  staffLink?: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);
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
          <SheetTitle>Меню</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <span>{l.label}</span>
              {l.showCart ? <CartBadge /> : null}
            </Link>
          ))}
          {staffLink ? (
            <>
              <div className="my-2 border-t" />
              <Link
                href={staffLink.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
              >
                {staffLink.label}
              </Link>
            </>
          ) : null}
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
