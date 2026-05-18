import { supabase } from "@/lib/supabase";
import { formatPkr, formatPkrCompact } from "@/lib/format-currency";

export interface AnalyticsKPI {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export interface RevenueTrend {
  month: string;
  current: number;
  previous: number;
}

export interface CategoryPerformance {
  name: string;
  value: string;
  pct: number;
  color: string;
}

export interface Acquisition {
  source: string;
  pct: number;
  color: string;
}

export interface RecentReport {
  name: string;
  meta: string;
}

export type AnalyticsPeriod = "Last 30 Days" | "Last Quarter" | "Custom Range";

export function getDateRange(period: AnalyticsPeriod) {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  if (period === "Last 30 Days") {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === "Last Quarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    // If we're in Q1, last quarter is Q4 of last year
    start = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    end = new Date(now.getFullYear(), currentQuarter * 3, 0);
  } else {
    // Default / Custom Range (placeholder)
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return { start, end };
}

export async function getAnalyticsKPIs(
  period: AnalyticsPeriod = "Last 30 Days",
  customRange?: { start: Date; end: Date },
): Promise<AnalyticsKPI[]> {
  const { start, end } = customRange || getDateRange(period);

  // Calculate previous period for comparison
  const duration = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - duration);
  const prevEnd = start;

  // Revenue = cash collected (payment completed + paid_at in window). Not unpaid / packed-only orders.
  const { data: currentOrders } = await supabase
    .from("orders")
    .select("total_amount, paid_at")
    .eq("payment_status", "completed")
    .not("status", "in", "(cancelled,refunded)")
    .not("paid_at", "is", null)
    .gte("paid_at", start.toISOString())
    .lte("paid_at", end.toISOString());

  const { data: previousOrders } = await supabase
    .from("orders")
    .select("total_amount, paid_at")
    .eq("payment_status", "completed")
    .not("status", "in", "(cancelled,refunded)")
    .not("paid_at", "is", null)
    .gte("paid_at", prevStart.toISOString())
    .lt("paid_at", prevEnd.toISOString());

  const { data: allPaidOrders } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("payment_status", "completed")
    .not("status", "in", "(cancelled,refunded)");

  // Get current period customers
  const { count: currentCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  // Get previous period customers
  const { count: previousCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", prevStart.toISOString())
    .lt("created_at", prevEnd.toISOString());

  // Calculate metrics
  const currentRevenue =
    currentOrders?.reduce((sum, order) => sum + parseFloat(String(order.total_amount)), 0) || 0;
  const previousRevenue =
    previousOrders?.reduce((sum, order) => sum + parseFloat(String(order.total_amount)), 0) || 0;
  const totalRevenue =
    allPaidOrders?.reduce((sum, order) => sum + parseFloat(String(order.total_amount)), 0) || 0;

  const currentOrderCount = currentOrders?.length || 0;
  const previousOrderCount = previousOrders?.length || 0;
  const totalOrderCount = allPaidOrders?.length || 0;

  const revenueChange =
    previousRevenue > 0
      ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
      : "0.0";
  const orderChange =
    previousOrderCount > 0
      ? (((currentOrderCount - previousOrderCount) / previousOrderCount) * 100).toFixed(1)
      : "0.0";
  const customerChange =
    previousCustomers && previousCustomers > 0
      ? (((currentCustomers! - previousCustomers) / previousCustomers) * 100).toFixed(1)
      : "0.0";

  const avgOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;
  const previousAvgOrderValue = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
  const avgOrderValueChange =
    previousAvgOrderValue > 0
      ? (((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100).toFixed(1)
      : "0.0";

  return [
    {
      label: "Revenue (collected)",
      value: formatPkr(totalRevenue),
      change: `${revenueChange.startsWith("-") ? "" : "+"}${revenueChange}%`,
      positive: parseFloat(revenueChange) >= 0,
    },
    {
      label: "Paid orders",
      value: totalOrderCount.toString(),
      change: `${orderChange.startsWith("-") ? "" : "+"}${orderChange}%`,
      positive: parseFloat(orderChange) >= 0,
    },
    {
      label: "New Customers",
      value: currentCustomers?.toString() || "0",
      change: `${customerChange.startsWith("-") ? "" : "+"}${customerChange}%`,
      positive: parseFloat(customerChange) >= 0,
    },
    {
      label: "Avg. Order Value",
      value: formatPkr(avgOrderValue),
      change: `${avgOrderValueChange.startsWith("-") ? "" : "+"}${avgOrderValueChange}%`,
      positive: parseFloat(avgOrderValueChange) >= 0,
    },
  ];
}

export async function getRevenueTrends(
  period: AnalyticsPeriod = "Last 30 Days",
  customRange?: { start: Date; end: Date },
): Promise<RevenueTrend[]> {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const trends: RevenueTrend[] = [];

  for (let i = 0; i < 7; i++) {
    const monthIndex = (now.getMonth() - 6 + i + 12) % 12;
    const monthName = months[monthIndex];

    // Current year month
    const currentMonthStart = new Date(currentYear, monthIndex, 1);
    const currentMonthEnd = new Date(currentYear, monthIndex + 1, 1);

    // Previous year month
    const previousMonthStart = new Date(previousYear, monthIndex, 1);
    const previousMonthEnd = new Date(previousYear, monthIndex + 1, 1);

    // Current year month — revenue recognized when marked paid (paid_at)
    const { data: currentData } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "completed")
      .not("status", "in", "(cancelled,refunded)")
      .not("paid_at", "is", null)
      .gte("paid_at", currentMonthStart.toISOString())
      .lt("paid_at", currentMonthEnd.toISOString());

    const { data: previousData } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "completed")
      .not("status", "in", "(cancelled,refunded)")
      .not("paid_at", "is", null)
      .gte("paid_at", previousMonthStart.toISOString())
      .lt("paid_at", previousMonthEnd.toISOString());

    const currentRevenue =
      currentData?.reduce((sum, order) => sum + parseFloat(String(order.total_amount)), 0) || 0;
    const previousRevenue =
      previousData?.reduce((sum, order) => sum + parseFloat(String(order.total_amount)), 0) || 0;

    trends.push({
      month: monthName,
      current: Math.round(currentRevenue),
      previous: Math.round(previousRevenue),
    });
  }

  return trends;
}

export async function getCategoryPerformance(
  period: AnalyticsPeriod = "Last 30 Days",
  customRange?: { start: Date; end: Date },
): Promise<CategoryPerformance[]> {
  const { start, end } = customRange || getDateRange(period);

  // Get order items with product information within the date range
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      total_price,
      quantity,
      created_at,
      products!inner(
        category,
        name
      )
    `,
    )
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  // Group by category
  const categoryRevenue: Record<string, number> = {};
  const totalRevenue =
    orderItems?.reduce((sum, item) => sum + parseFloat(item.total_price), 0) || 0;

  orderItems?.forEach((item) => {
    const products = item.products as unknown as { category: string; name: string };
    const category = products?.category || "Unknown";
    if (!categoryRevenue[category]) {
      categoryRevenue[category] = 0;
    }
    categoryRevenue[category] += parseFloat(item.total_price);
  });

  // Convert to array and sort by revenue
  const categories = Object.entries(categoryRevenue)
    .map(([name, revenue]) => ({
      name,
      value: formatPkrCompact(revenue),
      pct: Math.round((revenue / totalRevenue) * 100),
      color:
        name === "Onesies"
          ? "var(--color-primary)"
          : name === "Accessories"
            ? "oklch(0.55 0.13 20)"
            : "var(--color-gold)",
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  return categories;
}

export async function getCustomerAcquisition(
  period: AnalyticsPeriod = "Last 30 Days",
  customRange?: { start: Date; end: Date },
): Promise<Acquisition[]> {
  const { start, end } = customRange || getDateRange(period);

  // Get customer acquisition data from database within date range
  const { data: customers } = await supabase
    .from("customers")
    .select("acquisition_source, acquisition_channel, referral_source, created_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (!customers || customers.length === 0) {
    return [{ source: "Direct", pct: 100, color: "var(--color-primary)" }];
  }

  // Group customers by acquisition source
  const sourceCounts: Record<string, number> = {};
  const totalCustomers = customers.length;

  customers.forEach((customer) => {
    const c = customer as {
      acquisition_source: string | null;
      acquisition_channel: string | null;
      referral_source: string | null;
    };
    let source = "Direct"; // default

    // Prioritize acquisition_channel for specific platforms
    if (c.acquisition_channel) {
      source = c.acquisition_channel;
    } else if (c.acquisition_source) {
      source = c.acquisition_source;
    } else if (c.referral_source) {
      source = c.referral_source;
    }

    // Map source names to display names
    const displaySource = mapSourceToDisplayName(source);

    if (!sourceCounts[displaySource]) {
      sourceCounts[displaySource] = 0;
    }
    sourceCounts[displaySource]++;
  });

  // Convert to array and calculate percentages
  const acquisitions = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      pct: Math.round((count / totalCustomers) * 100),
      color: getSourceColor(source),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5); // Top 5 sources

  return acquisitions;
}

function mapSourceToDisplayName(source: string): string {
  const sourceMap: Record<string, string> = {
    social: "Social Media",
    organic_search: "Organic Search",
    paid_search: "Paid Search",
    paid: "Paid Ads",
    email: "Email",
    referral: "Referral",
    direct: "Direct",
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    twitter: "Twitter/X",
    pinterest: "Pinterest",
    google: "Google",
    friend: "Friend/Family",
    instagram_ad: "Instagram Ads",
    facebook_ad: "Facebook Ads",
    other: "Other",
  };

  return sourceMap[source] || source;
}

function getSourceColor(source: string): string {
  const colorMap: Record<string, string> = {
    "Social Media": "oklch(0.55 0.13 20)",
    "Organic Search": "var(--color-primary)",
    "Paid Search": "oklch(0.65 0.15 350)",
    "Paid Ads": "oklch(0.65 0.15 30)",
    Email: "oklch(0.65 0.15 150)",
    Referral: "var(--color-gold)",
    Direct: "oklch(0.55 0.13 250)",
    Instagram: "oklch(0.55 0.13 330)",
    TikTok: "oklch(0.55 0.13 20)",
    Facebook: "oklch(0.55 0.13 350)",
    "Twitter/X": "oklch(0.55 0.13 200)",
    Pinterest: "oklch(0.55 0.13 30)",
    LinkedIn: "oklch(0.55 0.13 250)",
    YouTube: "oklch(0.55 0.13 60)",
    Google: "oklch(0.55 0.13 200)",
    Bing: "oklch(0.55 0.13 290)",
    Yahoo: "oklch(0.55 0.13 340)",
    "Friend/Family": "var(--color-gold)",
    "Instagram Ads": "oklch(0.55 0.13 330)",
    "Facebook Ads": "oklch(0.55 0.13 350)",
  };

  return colorMap[source] || "var(--color-primary)";
}

export interface OrderStatusBreakdown {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export async function getOrderStatusBreakdown(): Promise<OrderStatusBreakdown[]> {
  const { data: orders } = await supabase.from("orders").select("status");

  if (!orders || orders.length === 0) {
    return [
      { label: "Placed", count: 0, pct: 0, color: "var(--color-primary)" },
      { label: "Delivered", count: 0, pct: 0, color: "oklch(0.55 0.16 145)" },
      { label: "Cancelled", count: 0, pct: 0, color: "oklch(0.55 0.2 25)" },
    ];
  }

  const total = orders.length;

  // "Placed" = order_placed, pending_payment, payment_initiated, paid, confirmed, packed
  const placedStatuses = [
    "order_placed",
    "pending_payment",
    "payment_initiated",
    "paid",
    "confirmed",
    "packed",
  ];
  // "Delivered" = shipped + delivered
  const deliveredStatuses = ["shipped", "delivered"];
  // "Cancelled" = cancelled + refunded
  const cancelledStatuses = ["cancelled", "refunded"];

  const placedCount = orders.filter((o) => placedStatuses.includes(o.status)).length;
  const deliveredCount = orders.filter((o) => deliveredStatuses.includes(o.status)).length;
  const cancelledCount = orders.filter((o) => cancelledStatuses.includes(o.status)).length;

  return [
    {
      label: "Placed",
      count: placedCount,
      pct: total > 0 ? Math.round((placedCount / total) * 100) : 0,
      color: "var(--color-primary)",
    },
    {
      label: "Delivered",
      count: deliveredCount,
      pct: total > 0 ? Math.round((deliveredCount / total) * 100) : 0,
      color: "oklch(0.55 0.16 145)",
    },
    {
      label: "Cancelled",
      count: cancelledCount,
      pct: total > 0 ? Math.round((cancelledCount / total) * 100) : 0,
      color: "oklch(0.55 0.2 25)",
    },
  ];
}

export async function getRecentReports(): Promise<RecentReport[]> {
  // Mock reports - in a real app, these would be actual generated reports
  return [
    { name: "Monthly_Sales_Q3.pdf", meta: "Generated 2 hours ago • 4.2 MB" },
    { name: "Customer_Retention_Aug.csv", meta: "Generated 1 day ago • 1.1 MB" },
    { name: "Inventory_Status_Main.xlsx", meta: "Generated 3 days ago • 2.5 MB" },
  ];
}
