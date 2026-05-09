import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Дашборд</h1>
        <p className="mt-2 text-muted-foreground">
          Сводка по заявкам, клиентам и каталогу.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Новые заявки" value="—" hint="Сегодня" />
        <Stat label="Активные клиенты" value="—" hint="Всего" />
        <Stat label="Товаров в базе" value="—" hint="Активных" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Скоро</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Подключим реальные данные после применения миграций и первой Excel-загрузки.
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
