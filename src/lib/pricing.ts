export function applyDiscount(basePrice: number, discountPercent: number | null | undefined): number {
  const d = discountPercent ?? 0;
  if (d <= 0) return basePrice;
  return Math.round(basePrice * (1 - d / 100) * 100) / 100;
}

export function formatPrice(amount: number, currency: string): string {
  const formatted = amount.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}
