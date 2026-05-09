import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PackageSearch,
  ListChecks,
  ScanBarcode,
  Truck,
  ShieldCheck,
  Bike,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Directions />
        <HowItWorks />
        <CtaBlock />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Sayor Motors"
            width={140}
            height={36}
            priority
            className="h-9 w-auto"
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#directions" className="transition hover:text-foreground">
            Направления
          </a>
          <a href="#how" className="transition hover:text-foreground">
            Как это работает
          </a>
          <a href="#contact" className="transition hover:text-foreground">
            Контакты
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Войти</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Получить B2B-доступ</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b bg-gradient-to-b from-accent/40 to-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="flex flex-col justify-center gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            B2B · Параллельный импорт · Опт
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Запчасти BMW для опта.
            <br />
            <span className="text-primary">Без долгой переписки.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Sayor Motors — оптовая поставка оригинальных и аналоговых запчастей для
            BMW, BMW Motorrad и China-made BMW. Загружайте список из 50–60 артикулов,
            получайте цену, наличие и срок поставки за минуты. Менеджер подтверждает
            заявку, без ручной переписки.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Получить B2B-доступ</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">У меня уже есть аккаунт</Link>
            </Button>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-6 border-t pt-6 text-sm">
            <div>
              <dt className="text-muted-foreground">Проверка</dt>
              <dd className="text-base font-semibold">до 60 артикулов</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Источники</dt>
              <dd className="text-base font-semibold">DE · CN · склад</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Для кого</dt>
              <dd className="text-base font-semibold">СТО · опт · дилеры</dd>
            </div>
          </dl>
        </div>
        <div className="hidden items-center justify-center md:flex">
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Массовая проверка
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                4 / 5 найдено
              </span>
            </div>
            <Separator className="my-4" />
            <ul className="space-y-3 text-sm font-mono">
              <PreviewRow article="34116859066" status="ok" stock="12" price="85 €" />
              <PreviewRow article="13718518111" status="oos" stock="0" price="—" />
              <PreviewRow article="11428507683" status="ok" stock="30" price="12 €" />
              <PreviewRow article="63117419615" status="ok" stock="4" price="320 €" />
              <PreviewRow article="34356790303" status="ok" stock="80" price="6 €" />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewRow({
  article,
  status,
  stock,
  price,
}: {
  article: string;
  status: "ok" | "oos";
  stock: string;
  price: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-foreground">{article}</span>
      <span
        className={
          status === "ok"
            ? "text-emerald-600"
            : "text-muted-foreground line-through"
        }
      >
        {stock} шт
      </span>
      <span className="font-semibold text-foreground">{price}</span>
    </li>
  );
}

function Directions() {
  return (
    <section id="directions" className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex flex-col gap-2">
          <span className="text-sm font-medium text-primary">Направления</span>
          <h2 className="text-3xl font-semibold tracking-tight">
            Что мы возим
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <ShieldCheck className="size-5 text-primary" />
              <CardTitle className="mt-2">BMW · оригинал и аналог</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Полный спектр запчастей для легковых BMW. Германия, Китай, склад в УЗ
              и транзит. Оригинальные артикулы и проверенные аналоги.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Bike className="size-5 text-primary" />
              <CardTitle className="mt-2">BMW Motorrad</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Запчасти для мотоциклов BMW. Расходники, тормозная система, кузовные
              элементы. Под заказ из Европы.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Truck className="size-5 text-primary" />
              <CardTitle className="mt-2">China-made BMW</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Запчасти для BMW китайской сборки. Прямой канал из Китая, отдельные
              артикулы, которых нет в европейских каталогах.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: ShieldCheck,
      title: "1. Заявка на доступ",
      text: "Регистрируете компанию. Менеджер проверяет данные и открывает кабинет с B2B-ценами.",
    },
    {
      icon: PackageSearch,
      title: "2. Поиск по артикулу",
      text: "Один артикул, VIN или список — система мгновенно показывает наличие, цену, срок и источник.",
    },
    {
      icon: ListChecks,
      title: "3. Массовая проверка",
      text: "Вставляете до 60 артикулов или Excel. Получаете таблицу с готовой подборкой.",
    },
    {
      icon: ScanBarcode,
      title: "4. Заявка менеджеру",
      text: "Корзина превращается в заявку. Менеджер подтверждает, частично подтверждает или предлагает аналоги.",
    },
  ];

  return (
    <section id="how" className="bg-accent/30 border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex flex-col gap-2">
          <span className="text-sm font-medium text-primary">Как это работает</span>
          <h2 className="text-3xl font-semibold tracking-tight">
            От артикула до подтвержденной заявки
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <Icon className="size-5 text-primary" />
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBlock() {
  return (
    <section id="contact" className="border-b">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            Откройте B2B-кабинет
          </h2>
          <p className="mt-3 text-muted-foreground">
            Заявку рассматриваем в течение рабочего дня. После одобрения вы получаете
            доступ к ценам, остаткам и срокам поставки по всей нашей базе.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/register">Подать заявку</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Вход для клиентов</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Sayor Motors"
            width={120}
            height={30}
            className="h-7 w-auto"
          />
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Sayor Motors. Все права защищены.
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          B2B-платформа · Не публичный розничный магазин · Параллельный импорт
        </p>
      </div>
    </footer>
  );
}
