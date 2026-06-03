import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Plus, Filter, ArrowDownUp, Pencil, Trash2, Calendar, History, Clock } from "lucide-react";
import { coupons } from "@/lib/admin-data";
import { useState } from "react";

export const Route = createFileRoute("/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout searchPlaceholder="Search coupon codes…">
      <CouponsContent />
    </AdminLayout>
  ),
});

const tabs = ["All Coupons", "Active", "Expired", "Scheduled"] as const;

function CouponsContent() {
  const [tab, setTab] = useState<typeof tabs[number]>("All Coupons");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Coupon Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your boutique's promotional offers with elegance. Track performance and create tailored discounts for your discerning clientele.
          </p>
        </div>
        <Button className="rounded-full h-12 px-6"><Plus className="h-4 w-4" /> New Coupon</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Active Offers" value="12" note="↗ +3 this month" />
        <StatCard label="Total Redeemed" value="1,284" note="✨ 82% conversion" noteColor="text-[color:var(--color-gold-foreground)]" />
        <StatCard label="Revenue Influence" value="$14.2k" note="🐷 $2.4k saved" />
        <div className="rounded-2xl p-6 bg-gradient-to-br from-primary to-lilac text-primary-foreground">
          <div className="font-serif text-xl">Seasonal Discounts</div>
          <div className="mt-2 text-sm opacity-90">Prepare for the Autumn Collection launch.</div>
        </div>
      </div>

      <div className="rounded-full bg-card p-2 shadow-[var(--shadow-card)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex">
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
        <div className="flex items-center gap-2 pr-2">
          <button className="inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm hover:bg-muted"><Filter className="h-3.5 w-3.5" /> Filter By Type</button>
          <button className="inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm hover:bg-muted"><ArrowDownUp className="h-3.5 w-3.5" /> Newest First</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.map((c) => (
          <CouponCard key={c.code} c={c} />
        ))}

        <div className="rounded-2xl bg-primary-soft/40 p-6 flex flex-col">
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Most Successful</div>
          <div className="mt-2 font-serif text-3xl text-primary">LUXE20</div>
          <div className="mt-auto pt-8">
            <div className="font-serif text-2xl text-foreground">20%</div>
            <div className="text-xs text-muted-foreground">Storewide Discount</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Showing 1 to 5 of 32 total coupon campaigns</div>
        <div className="flex items-center gap-1">
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">‹</button>
          <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm">1</button>
          <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">2</button>
          <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">3</button>
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">›</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, note, noteColor = "text-emerald-600" }: { label: string; value: string; note: string; noteColor?: string }) {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-3xl font-serif text-primary">{value}</div>
      <div className={`mt-3 text-xs ${noteColor}`}>{note}</div>
    </div>
  );
}

function CouponCard({ c }: { c: typeof coupons[number] }) {
  const isExpired = c.status === "Expired";
  const isScheduled = c.status === "Scheduled";

  if (isScheduled) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] flex flex-col">
        <div className="flex items-start justify-between">
          <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium">Scheduled</span>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-6 font-serif text-2xl text-primary">{c.code}</div>
        <div className="mt-4 text-sm text-muted-foreground">Starts: {c.expires}</div>
        <div className="mt-2 text-lg font-medium">{c.discount} Discount</div>
        <div className="mt-auto pt-6 flex gap-2">
          <Button variant="outline" className="flex-1 rounded-full">Edit</Button>
          <Button variant="ghost" size="icon" className="rounded-full">×</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl shadow-[var(--shadow-card)] overflow-hidden ${isExpired ? "opacity-60" : ""}`}>
      <div className={`p-6 ${isExpired ? "bg-muted" : "bg-primary-soft/50"} relative`}>
        <span className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
          isExpired ? "bg-muted-foreground/20 text-muted-foreground" : "bg-card text-[color:var(--color-gold-foreground)]"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isExpired ? "bg-muted-foreground" : "bg-[color:var(--color-gold)]"}`} />
          {c.status}
        </span>
        <div className="font-serif text-5xl text-primary/40">{c.discount}</div>
        <div className="mt-4 font-serif text-2xl text-primary">{c.code}</div>
      </div>
      <div className="bg-card p-5">
        <div className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>Discount Type</span>
          <span>Redemptions</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-medium">{c.type}</span>
          <span className="font-medium">{c.redemptions}</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {isExpired ? <History className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
            <div>
              <div>{isExpired ? "Ended On" : "Expires On"}</div>
              <div className="font-medium text-foreground">{c.expires}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isExpired && <button className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>}
            <button className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-muted-foreground">
              {isExpired ? <History className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
