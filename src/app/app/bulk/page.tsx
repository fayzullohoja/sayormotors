import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkClient } from "./bulk-client";

export const metadata: Metadata = {
  title: "Массовая проверка",
};

export default function BulkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Массовая проверка
        </h1>
        <p className="mt-2 text-muted-foreground">
          Вставьте до 200 артикулов или загрузите Excel — мгновенно увидите цену,
          наличие и срок поставки. Найденные позиции добавляются в корзину одним
          кликом.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Список артикулов</CardTitle>
        </CardHeader>
        <CardContent>
          <BulkClient />
        </CardContent>
      </Card>
    </div>
  );
}
