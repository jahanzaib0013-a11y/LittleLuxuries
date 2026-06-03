import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Plus, Tag, ShoppingCart, DollarSign, UserPlus, Package, ExternalLink, MoreHorizontal } from "lucide-react";
import { dashboardStats, dailySales, topSellers, recentOrders } from "@/lib/admin-data";
import logo from "@/assets/logo.png";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout
      searchPlaceholder="Search orders, customers, or items…"
      rightSlot={
        <>
          <Button className="rounded-full h-10"><Plus className="h-4 w-4" /> Add Product</Button>
          <Button variant="outline" className="rounded-full h-10"><Tag className="h-4 w-4" /> Add Coupon</Button>
        </>
      }
    >
      <DashboardContent />
    </AdminLayout>
  ),
});

const statIcons = [ShoppingCart, DollarSign, UserPlus, Package];
const toneBg: Record<string, string> = {
  lilac: "bg-primary-soft text-primary",
  blush: "bg-[color:var(--color-blush)]/40 text-[color:var(--color-secondary)]",
  gold: "bg-[color:var(--color-gold)]/25 text-[color:var(--color-gold-foreground)]",
};

function DashboardContent() {
  const [period, setPeriod] = useState<"Weekly" | "Monthly">("Weekly");
  const max = Math.max(...dailySales.map((d) => d.value));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {dashboardStats.map((s, i) => {
          const Icon = statIcons[i];
          return (
            <div key={s.label} className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between">
                <div className={`h-12 w-12 rounded-xl grid place-items-center ${toneBg[s.tone]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-medium ${s.trend === "warn" ? "text-destructive" : "text-emerald-600"}`}>
                  {s.change} {s.trend === "up" && "↗"}
                </span>
              </div>
              <div className="mt-6 text-xs uppercase tracking-[0.15em] text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-serif text-foreground">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales chart */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-2xl text-foreground">Daily Sales Performance</h2>
              <p className="text-sm text-muted-foreground mt-1">Real-time overview of transaction volume</p>
            </div>
            <div className="inline-flex rounded-full bg-muted p-1 text-xs">
              {(["Weekly", "Monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-full transition ${period === p ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-1.5 sm:gap-3 h-48 sm:h-56 items-end">
            {dailySales.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-2 sm:gap-3 h-full justify-end">
                <div
                  className={`w-full rounded-t-lg transition-all ${d.value === max ? "bg-primary" : "bg-primary/15"}`}
                  style={{ height: `${(d.value / max) * 100}%` }}
                />
                <span className="text-[10px] sm:text-xs text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top sellers */}
        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-2xl text-foreground">Top Sellers</h2>
          <div className="mt-6 space-y-4">
            {topSellers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl grid place-items-center ${i === 0 ? "bg-primary-soft" : i === 1 ? "bg-[color:var(--color-blush)]/40" : "bg-[color:var(--color-gold)]/20"}`}>
                  <img src={logo} alt="" className="h-7 w-7 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.collection}</div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-semibold">{p.sales}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sales</div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-6 rounded-full border-dashed">
            View All Products
          </Button>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-foreground">Recent Orders</h2>
          <button className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
            View Reports <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.15em] text-muted-foreground border-b border-border">
                <th className="text-left font-medium py-3">Order ID</th>
                <th className="text-left font-medium py-3">Customer</th>
                <th className="text-left font-medium py-3">Date</th>
                <th className="text-left font-medium py-3">Total</th>
                <th className="text-left font-medium py-3">Status</th>
                <th className="text-right font-medium py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-border/50 last:border-0">
                  <td className="py-4 text-primary font-medium">{o.id}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${
                        o.status === "Pending" ? "bg-[color:var(--color-blush)]/50 text-[color:var(--color-secondary)]" :
                        o.status === "Shipped" ? "bg-primary-soft text-primary" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>{o.initials}</div>
                      <span className="text-foreground">{o.customer}</span>
                    </div>
                  </td>
                  <td className="py-4 text-muted-foreground">{o.date}</td>
                  <td className="py-4 font-medium text-foreground">{o.total}</td>
                  <td className="py-4">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="w-full text-center text-sm text-muted-foreground py-4 mt-2 hover:text-primary">
          Load More Orders
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-[color:var(--color-gold)]/25 text-[color:var(--color-gold-foreground)]",
    Shipped: "bg-primary-soft text-primary",
    Delivered: "bg-emerald-100 text-emerald-700",
    Confirmed: "bg-blue-100 text-blue-700",
    Packed: "bg-[color:var(--color-blush)]/50 text-[color:var(--color-secondary)]",
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${styles[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}
