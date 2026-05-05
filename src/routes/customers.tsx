import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Download, UserPlus, ChevronDown, Star } from "lucide-react";
import { customers } from "@/lib/admin-data";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout searchPlaceholder="Search customers…">
      <CustomersContent />
    </AdminLayout>
  ),
});

function CustomersContent() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-foreground">Customers</h1>
          <p className="mt-2 text-sm text-muted-foreground">Managing 2,482 luxury client accounts and preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full h-11"><Download className="h-4 w-4" /> Export CSV</Button>
          <Button className="rounded-full h-11"><UserPlus className="h-4 w-4" /> Add Customer</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-xl bg-primary-soft grid place-items-center text-primary"><UserPlus className="h-5 w-5" /></div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">+12%</span>
          </div>
          <div className="mt-6 text-xs uppercase tracking-[0.15em] text-muted-foreground">New this month</div>
          <div className="mt-1 text-3xl font-serif">142</div>
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-xl bg-[color:var(--color-gold)]/25 grid place-items-center text-[color:var(--color-gold-foreground)]"><Star className="h-5 w-5" /></div>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">Stable</span>
          </div>
          <div className="mt-6 text-xs uppercase tracking-[0.15em] text-muted-foreground">Avg. Lifetime Value</div>
          <div className="mt-1 text-3xl font-serif">$842.00</div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-br from-primary to-lilac text-primary-foreground relative overflow-hidden">
          <div className="text-xs uppercase tracking-[0.15em] opacity-80">Exclusive Membership</div>
          <div className="mt-2 font-serif text-2xl">Little Luxuries Gold Club</div>
          <div className="mt-6 flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="h-7 w-7 rounded-full bg-[color:var(--color-gold)] border-2 border-primary" />
              <div className="h-7 w-7 rounded-full bg-[color:var(--color-blush)] border-2 border-primary" />
              <div className="h-7 w-7 rounded-full bg-primary-soft border-2 border-primary" />
            </div>
            <span className="text-sm">42 new members joined today</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-muted/40 text-sm">Status: All <ChevronDown className="h-3 w-3" /></button>
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-muted/40 text-sm">Tier: All <ChevronDown className="h-3 w-3" /></button>
          </div>
          <div className="text-sm text-muted-foreground">Showing 1–{customers.length} of 2,482 customers</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.15em] text-muted-foreground border-b border-border bg-muted/20">
                <th className="px-6 py-4 text-left font-medium">Customer Name</th>
                <th className="px-4 py-4 text-left font-medium">Email Address</th>
                <th className="px-4 py-4 text-left font-medium">Total Orders</th>
                <th className="px-4 py-4 text-left font-medium">Total Spent</th>
                <th className="px-4 py-4 text-left font-medium">Join Date</th>
                <th className="px-4 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full grid place-items-center text-xs font-semibold ${
                        c.color === "blush" ? "bg-[color:var(--color-blush)]/50 text-[color:var(--color-secondary)]" :
                        c.color === "gold" ? "bg-[color:var(--color-gold)]/30 text-[color:var(--color-gold-foreground)]" :
                        "bg-primary-soft text-primary"
                      }`}>{c.initials}</div>
                      <div>
                        <div className="font-medium text-foreground">{c.name}</div>
                        {c.tier === "Gold" ? (
                          <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-gold-foreground)] font-semibold">Gold Member</span>
                        ) : (
                          <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Standard</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-5">
                    {c.orders} {c.pending > 0 && <span className="text-xs text-muted-foreground">({c.pending} pending)</span>}
                  </td>
                  <td className="px-4 py-5 font-medium">{c.spent}</td>
                  <td className="px-4 py-5 text-muted-foreground">{c.joined}</td>
                  <td className="px-4 py-5 text-right">
                    <button className="text-primary text-sm font-medium hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button className="text-sm text-muted-foreground hover:text-foreground">‹ Previous</button>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm">1</button>
            <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">2</button>
            <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">3</button>
            <span className="px-2 text-muted-foreground">…</span>
            <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">248</button>
          </div>
          <button className="text-sm text-muted-foreground hover:text-foreground">Next ›</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-5">
          <div className="text-sm font-semibold text-foreground">Churn Prevention</div>
          <div className="text-xs text-muted-foreground mt-1">82 customers haven't purchased in 60 days. <a className="text-primary underline">Send campaign?</a></div>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-gold)]/30 bg-[color:var(--color-gold)]/10 p-5">
          <div className="text-sm font-semibold text-foreground">Review Requests</div>
          <div className="text-xs text-muted-foreground mt-1">12 new orders delivered yesterday are eligible for review follow-ups.</div>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 p-5">
          <div className="text-sm font-semibold text-foreground">Quick Export</div>
          <div className="text-xs text-muted-foreground mt-1">Last export was generated on Jan 14, 2024 by elena.vance</div>
        </div>
      </div>
    </div>
  );
}
