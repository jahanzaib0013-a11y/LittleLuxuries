/** Storefront and admin default display currency */
export const STORE_CURRENCY_CODE = "PKR" as const;

const pkrStandard = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const pkrCompact = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Full PKR amount for prices, order totals, and line items */
export function formatPkr(amount: number): string {
  if (!Number.isFinite(amount)) return pkrStandard.format(0);
  return pkrStandard.format(amount);
}

/** Shorter PKR for charts and dense KPI tiles */
export function formatPkrCompact(amount: number): string {
  if (!Number.isFinite(amount)) return pkrCompact.format(0);
  return pkrCompact.format(amount);
}
