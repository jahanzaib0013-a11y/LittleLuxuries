import type { QueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "./dashboard-queries";

// Every cached view that derives from orders/customers data. Invalidating these
// after a mutation (delete, status/payment change) keeps the dashboard,
// analytics, and customer pages in sync — not just the page that made the change.
// A partial key prefix invalidates every matching query, e.g. ["revenue-trends"]
// matches ["revenue-trends", period, customRange].
const DERIVED_KEYS: readonly unknown[][] = [
  [...dashboardKeys.all],
  ["order-status-breakdown"],
  ["revenue-trends"],
  ["analytics-kpis"],
  ["customer-acquisition"],
  ["vip-activity"],
  ["recent-reports"],
  ["customers"],
  ["customer-stats"],
  ["customer-orders"],
];

/** Invalidate all order/customer-derived caches so every page reflects the change. */
export function invalidateOrderData(queryClient: QueryClient) {
  for (const key of DERIVED_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

/** Customers feed the same downstream analytics, so reuse the same invalidation set. */
export const invalidateCustomerData = invalidateOrderData;
