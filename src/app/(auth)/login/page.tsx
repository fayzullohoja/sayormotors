import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./form";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в B2B-кабинет Sayor Motors",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Вход в кабинет</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          B2B-доступ для оптовых клиентов
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Ещё нет доступа?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Подать B2B-заявку
        </Link>
      </p>
    </div>
  );
}
