import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./form";

export const metadata: Metadata = {
  title: "Получить B2B-доступ",
  description:
    "Заполните форму, и менеджер откроет доступ к B2B-каталогу запчастей Sayor Motors.",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">B2B-заявка</h1>
        <p className="mt-2 text-muted-foreground">
          Заполните данные компании. После проверки менеджер откроет доступ к
          ценам, наличию и срокам поставки.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
