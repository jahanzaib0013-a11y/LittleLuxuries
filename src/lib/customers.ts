import { supabase } from "@/lib/supabase";
import { formatPkr } from "@/lib/format-currency";

export interface Customer {
  id: string;
  customer_name: string;
  email: string;
  membership_tier: "Standard" | "Bronze" | "Silver" | "Gold" | "Platinum";
  total_orders: number;
  pending_orders: number;
  total_spent: string;
  join_date: string;
  phone?: string;
  created_at: string;
}

export interface CustomerStats {
  total_customers: number;
  new_this_month: number;
  avg_lifetime_value: string;
  tier_counts: {
    Platinum: number;
    Gold: number;
    Silver: number;
    Bronze: number;
    Standard: number;
  };
  new_gold_today: number;
  top_members?: { name: string; order_count: number }[];
}

export function calculateTier(orderCount: number): Customer["membership_tier"] {
  if (orderCount >= 12) return "Platinum";
  if (orderCount >= 8) return "Gold";
  if (orderCount >= 5) return "Silver";
  if (orderCount >= 3) return "Bronze";
  return "Standard";
}

export async function getCustomers(
  page: number = 1,
  limit: number = 10,
  filters: { search?: string; tier?: string } = {},
): Promise<{ customers: Customer[]; total: number; page: number; totalPages: number }> {
  const offset = (page - 1) * limit;

  let query = supabase.from("customers").select(
    `
    id,
    first_name,
    last_name,
    email,
    membership_tier,
    join_date,
    phone,
    created_at,
    orders!left(
      id,
      status,
      total_amount,
      payment_status
    )
  `,
    { count: "exact" },
  );

  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`first_name.ilike.${search},last_name.ilike.${search},email.ilike.${search}`);
  }

  if (filters.tier && filters.tier !== "All") {
    query = query.eq("membership_tier", filters.tier);
  }

  const {
    data,
    error,
    count: total,
  } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching customers:", error);
    return { customers: [], total: 0, page: 1, totalPages: 0 };
  }

  interface CustomerQueryRow {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    membership_tier: string;
    join_date: string;
    phone: string | null;
    created_at: string;
    orders: Array<{
      id: string;
      status: string;
      total_amount: number | string;
      payment_status: string;
    }>;
  }

  const customers =
    (data as unknown as CustomerQueryRow[])?.map((customer) => {
      const orders = customer.orders || [];
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((order) =>
        ["pending_payment", "payment_initiated", "paid", "confirmed", "packed"].includes(
          order.status,
        ),
      ).length;
      const totalSpent = orders.reduce((sum, order) => {
        if (order.payment_status !== "completed") return sum;
        if (order.status === "cancelled" || order.status === "refunded") return sum;
        return sum + (parseFloat(String(order.total_amount)) || 0);
      }, 0);
      const membershipTier = calculateTier(totalOrders);

      return {
        id: customer.id,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        membership_tier: membershipTier,
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        total_spent: formatPkr(totalSpent),
        join_date: new Date(customer.join_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        phone: customer.phone ?? undefined,
        created_at: customer.created_at,
      };
    }) || [];

  const totalPages = Math.ceil((total || 0) / limit);

  return { customers, total: total || 0, page, totalPages };
}

export async function getCustomerStats(): Promise<CustomerStats> {
  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  // Get new customers this month
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const { count: newThisMonth } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", firstDayOfMonth.toISOString());

  // Get average lifetime value
  const { data: customerSpending } = await supabase.from("customers").select(`
      orders!left(
        total_amount,
        payment_status,
        status
      )
    `);

  let totalSpent = 0;
  let customersWithOrders = 0;

  interface SpendingQueryRow {
    orders: Array<{
      total_amount: number | string;
      payment_status: string;
      status: string;
    }>;
  }

  (customerSpending as unknown as SpendingQueryRow[])?.forEach((customer) => {
    const orders = customer.orders || [];
    if (orders.length > 0) {
      const spent = orders.reduce((sum: number, order) => {
        if (order.payment_status !== "completed") return sum;
        if (order.status === "cancelled" || order.status === "refunded") return sum;
        return sum + (parseFloat(String(order.total_amount)) || 0);
      }, 0);
      totalSpent += spent;
      customersWithOrders++;
    }
  });

  const avgLifetimeValue = customersWithOrders > 0 ? totalSpent / customersWithOrders : 0;

  const tier_counts = {
    Platinum: 0,
    Gold: 0,
    Silver: 0,
    Bronze: 0,
    Standard: 0,
  };

  (customerSpending as unknown as Array<{ orders: Array<unknown> }>)?.forEach((c) => {
    const count = c.orders?.length || 0;
    if (count >= 12) tier_counts.Platinum++;
    else if (count >= 8) tier_counts.Gold++;
    else if (count >= 5) tier_counts.Silver++;
    else if (count >= 3) tier_counts.Bronze++;
    else tier_counts.Standard++;
  });

  // Get new gold members today (those who reached 8 orders today)
  // Note: This is simplified; in a production app, we'd check when the 8th order was placed.
  // For now, we check customers who joined today and have 8+ orders, or we just use the count.
  const newGoldToday = 0; // Placeholder for more complex today-specific logic

  // Get top gold members by order count
  const { data: topMembersData } = await supabase.from("customers").select(`
      first_name,
      last_name,
      orders!left(id)
    `);

  interface TopMemberRow {
    first_name: string;
    last_name: string;
    orders: Array<{ id: string }>;
  }

  const topMembers =
    (topMembersData as unknown as TopMemberRow[])
      ?.map((m) => ({
        name: `${m.first_name} ${m.last_name}`,
        order_count: m.orders?.length || 0,
      }))
      .filter((m) => m.order_count >= 8)
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, 3) || [];

  return {
    total_customers: totalCustomers || 0,
    new_this_month: newThisMonth || 0,
    avg_lifetime_value: formatPkr(avgLifetimeValue),
    tier_counts,
    new_gold_today: newGoldToday || 0,
    top_members: topMembers,
  };
}
