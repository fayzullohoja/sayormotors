import type { CanonicalField, ColumnMapping } from "./types";

const PATTERNS: Record<CanonicalField, RegExp[]> = {
  article: [
    /^арти?кул/i,
    /^код( товара)?$/i,
    /^номер( детали)?$/i,
    /^part(\s*no\.?|\s*number)?$/i,
    /^sku$/i,
    /^art\.?$/i,
  ],
  name: [
    /^наимен/i,
    /^название/i,
    /^товар$/i,
    /^name$/i,
    /^description$/i,
    /^desc(ription)?$/i,
  ],
  brand: [/^бренд/i, /^марка$/i, /^brand$/i, /^производит/i, /^manufacturer$/i, /^maker$/i],
  category: [/^категор/i, /^группа$/i, /^category$/i, /^group$/i],
  base_price: [
    /^цена( продажи)?$/i,
    /^стоимость$/i,
    /^price$/i,
    /^retail( price)?$/i,
    /^продажа$/i,
  ],
  base_currency: [/^валюта$/i, /^currency$/i, /^cur$/i],
  cost_price: [
    /^цена закупки$/i,
    /^закупка$/i,
    /^закупочная$/i,
    /^cost( price)?$/i,
    /^purchase( price)?$/i,
  ],
  stock: [/^наличие$/i, /^остат(ок|ки)$/i, /^кол-?во$/i, /^количество$/i, /^stock$/i, /^qty$/i, /^quantity$/i],
  lead_time: [/^срок( поставки)?$/i, /^lead\s*time$/i, /^delivery( time)?$/i, /^доставка$/i],
  source: [/^источник$/i, /^source$/i, /^склад$/i, /^warehouse$/i],
  source_country: [/^страна( поставки)?$/i, /^country$/i, /^origin$/i],
  min_order: [/^мин.*(парт|заказ|количество)/i, /^min\.?\s*(order|qty)/i, /^moq$/i],
  applicability: [/^применим/i, /^applicab/i, /^fit(ment)?$/i, /^совместим/i],
  description: [/^описание$/i, /^описаниe$/i, /^description$/i, /^doc/i, /^доп\./i],
};

export function detectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const [canonicalKey, patterns] of Object.entries(PATTERNS) as Array<
    [CanonicalField, RegExp[]]
  >) {
    for (const header of headers) {
      const trimmed = (header ?? "").trim();
      if (!trimmed) continue;
      if (patterns.some((p) => p.test(trimmed))) {
        if (!mapping[canonicalKey]) {
          mapping[canonicalKey] = trimmed;
        }
        break;
      }
    }
  }
  return mapping;
}

export const CANONICAL_LABELS: Record<CanonicalField, string> = {
  article: "Артикул",
  name: "Название",
  brand: "Бренд",
  category: "Категория",
  base_price: "Цена продажи",
  base_currency: "Валюта",
  cost_price: "Цена закупки",
  stock: "Наличие",
  lead_time: "Срок поставки",
  source: "Источник",
  source_country: "Страна",
  min_order: "Мин. заказ",
  applicability: "Применимость",
  description: "Описание",
};
