import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
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
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
        <p className="font-mono text-sm uppercase tracking-widest text-primary">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Страница не найдена
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Артикул или ссылка не существует. Попробуйте поиск или вернитесь на
          главную.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/">На главную</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Войти в кабинет</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Получить B2B-доступ</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
