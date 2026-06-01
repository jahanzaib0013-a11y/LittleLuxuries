import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Download, Plus, Filter, Calendar, ChevronDown } from "lucide-react";
import { allOrders } from "@/lib/admin-data";
import { useState } from "react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders & Shipping — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout searchPlaceholder="Search by Order ID, Customer…">
      <OrdersContent />
    </AdminLayout>
  ),
});

const tabs = ["All Orders", "Pending", "Shipped", "Delivered"] as const;

function OrdersContent() {
  const [tab, setTab] = useState<typeof tabs[number]>("All Orders");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-foreground">Orders & Shipping</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Manage your boutique's fulfillment journey and customer transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full h-11"><Download className="h-4 w-4" /> Export Orders (CSV)</Button>
          <Button className="rounded-full h-11"><Plus className="h-4 w-4" /> Create New Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Orders", value: "1,284", note: "↗ 12% from last month", noteColor: "text-emerald-600" },
          { label: "Pending Fulfillment", value: "42", note: "⏱ 8 Priority express", noteColor: "text-[color:var(--color-gold-foreground)]" },
          { label: "Avg. Processing Time", value: "1.2 Days", note: "⚡ Faster than industry avg", noteColor: "text-primary" },
          { label: "Revenue (MTD)", value: "$18,420", note: "🎯 Target: $25,000", noteColor: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{s.label}</div>
            <div className="mt-3 text-3xl font-serif text-foreground">{s.value}</div>
            <div className={`mt-3 text-xs ${s.noteColor}`}>{s.note}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="inline-flex bg-muted/40 rounded-full p-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 text-sm rounded-full transition ${tab === t ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-muted/40 hover:bg-muted text-sm">
              <Calendar className="h-4 w-4" /> Last 30 Days <ChevronDown className="h-3 w-3" />
            </button>
            <button className="h-10 w-10 grid place-items-center rounded-full bg-muted/40 hover:bg-muted"><Filter className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.15em] text-muted-foreground border-b border-border">
                <th className="px-6 py-4 text-left font-medium">Order ID</th>
                <th className="px-4 py-4 text-left font-medium">Customer</th>
                <th className="px-4 py-4 text-left font-medium">Date</th>
                <th className="px-4 py-4 text-left font-medium">Items</th>
                <th className="px-4 py-4 text-left font-medium">Total</th>
                <th className="px-4 py-4 text-left font-medium">Payment</th>
                <th className="px-4 py-4 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((o) => (
                <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="px-6 py-5 text-primary font-medium">{o.id}</td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-soft text-primary grid place-items-center text-xs font-semibold">{o.initials}</div>
                      <span className="text-foreground">{o.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-muted-foreground">{o.date}</td>
                  <td className="px-4 py-5">{o.items}</td>
                  <td className="px-4 py-5 font-medium">{o.total}</td>
                  <td className="px-4 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${o.payment === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-[color:var(--color-blush)]/40 text-[color:var(--color-secondary)]"}`}>
                      {o.payment.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <OrderStatus status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">Showing 1 to 5 of 1,284 orders</div>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">‹</button>
            <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm">1</button>
            <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">2</button>
            <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">3</button>
            <span className="px-2 text-muted-foreground">…</span>
            <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">256</button>
            <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">›</button>
          </div>
        </div>
      </div>

      {/* Eco banner */}
      <div className="rounded-2xl bg-card p-8 shadow-[var(--shadow-card)] relative overflow-hidden">
        <h3 className="font-serif text-2xl text-foreground">Eco-Friendly Shipping Initiative</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Transitioning to 100% biodegradable packaging by year-end. Track your sustainability impact on the analytics dashboard.
        </p>
        <Button variant="outline" className="rounded-full mt-5">Learn More</Button>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 text-7xl">🌿</div>
      </div>
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-[color:var(--color-gold)]/25 text-[color:var(--color-gold-foreground)]",
    Confirmed: "bg-blue-100 text-blue-700",
    Packed: "bg-[color:var(--color-blush)]/40 text-[color:var(--color-secondary)]",
    Shipped: "bg-primary-soft text-primary",
    Delivered: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
