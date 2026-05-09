import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, ScanBarcode, ShoppingCart, FileText } from "lucide-react";

export default function ClientHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">B2B-кабинет</h1>
        <p className="mt-2 text-muted-foreground">
          Поиск запчастей, массовая проверка и заявки.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск по артикулу</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Поиск, корзина и заявки появятся, как только админ загрузит каталог. Пока
            страница — заглушка.
          </p>
          <Button disabled variant="outline">
            Поиск (скоро)
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ShortcutCard
          href="/app/bulk"
          icon={<ListChecks className="size-5" />}
          title="Массовая проверка"
          description="До 60 артикулов за раз"
        />
        <ShortcutCard
          href="/app/vin"
          icon={<ScanBarcode className="size-5" />}
          title="VIN-запрос"
          description="Подбор по VIN от менеджера"
        />
        <ShortcutCard
          href="/app/cart"
          icon={<ShoppingCart className="size-5" />}
          title="Корзина"
          description="Сформировать заявку"
        />
        <ShortcutCard
          href="/app/requests"
          icon={<FileText className="size-5" />}
          title="Мои заявки"
          description="История и статусы"
        />
      </div>
    </div>
  );
}

function ShortcutCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-accent p-2 text-primary">{icon}</span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}
