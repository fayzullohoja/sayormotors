import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-accent/30">
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
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        {children}
      </main>
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Sayor Motors · B2B-платформа
        </div>
      </footer>
    </div>
  );
}
