import { queryOptions, useQuery } from "@tanstack/react-query";
import { orderService, type OrderWithItems } from "./order-service";
import { productService } from "./supabase-service";
import { getCustomerStats } from "./customers";
import { FIVE_MINUTES } from "./query-client";

export interface DashboardTopSeller {
  name: string;
  collection: string;
  sales: number;
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  new_customers: number;
  low_stock_alerts: number;
}

export interface DashboardSummary {
  recentOrders: OrderWithItems[];
  stats: DashboardStats;
  topSellers: DashboardTopSeller[];
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (page: number, pageSize: number) =>
    [...dashboardKeys.all, "summary", page, pageSize] as const,
};

export async function fetchDashboardSummary(
  page: number,
  ordersPerPage: number,
): Promise<DashboardSummary> {
  try {
    const [ordersResult, statsData, topData, customerStats, lowStockCount] = await Promise.all([
      orderService.getAllOrders({
        limit: ordersPerPage,
        offset: (page - 1) * ordersPerPage,
      }),
      orderService.getOrderStats(),
      orderService.getTopSellers(3),
      getCustomerStats(),
      productService.getLowStockCount(),
    ]);

    return {
      recentOrders: ordersResult.error ? [] : ordersResult.orders,
      stats: {
        total_orders: statsData.error ? 0 : statsData.total_orders,
        total_revenue: statsData.error ? 0 : statsData.total_revenue,
        new_customers: customerStats.new_this_month,
        low_stock_alerts: lowStockCount,
      },
      // Show real sales only. No demo fallback — an empty list renders an empty
      // state rather than fake products.
      topSellers: topData.error ? [] : topData.topSellers,
    };
  } catch (error) {
    throw error;
  }
}

export const dashboardSummaryQueryOptions = (page: number, ordersPerPage: number) =>
  queryOptions({
    queryKey: dashboardKeys.summary(page, ordersPerPage),
    queryFn: () => fetchDashboardSummary(page, ordersPerPage),
    staleTime: FIVE_MINUTES,
    placeholderData: (previous) => previous,
  });

export function useDashboardSummary(page: number, ordersPerPage: number) {
  return useQuery(dashboardSummaryQueryOptions(page, ordersPerPage));
}
