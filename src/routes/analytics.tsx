import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Download, DollarSign, ShoppingCart, UserPlus, TrendingUp, Calendar, Lightbulb, FileText, DownloadCloud } from "lucide-react";
import { analyticsKpis, revenueTrend, categoryPerformance, acquisition, recentReports } from "@/lib/admin-data";
import { useState } from "react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout searchPlaceholder="Search analytics…" rightSlot={<Button variant="outline" className="rounded-full h-10"><Download className="h-4 w-4" /> Export Report</Button>}>
      <AnalyticsPage />
    </AdminLayout>
  ),
});

const kpiIcons = [DollarSign, ShoppingCart, UserPlus, TrendingUp];
const kpiTones = ["bg-primary-soft text-primary", "bg-[color:var(--color-blush)]/40 text-[color:var(--color-secondary)]", "bg-[color:var(--color-gold)]/25 text-[color:var(--color-gold-foreground)]", "bg-muted text-foreground"];
const periods = ["Last 30 Days", "Last Quarter", "Custom Range"] as const;

function AnalyticsPage() {
  const [period, setPeriod] = useState<typeof periods[number]>("Last 30 Days");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overview</div>
          <h1 className="font-serif text-3xl text-foreground mt-1">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Monitoring your boutique's growth and customer engagement.
          </p>
        </div>
        <div className="inline-flex bg-card rounded-full p-1 shadow-[var(--shadow-card)]">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs rounded-full inline-flex items-center gap-1.5 transition ${period === p ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground"}`}
            >
              {p === "Custom Range" && <Calendar className="h-3 w-3" />}
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {analyticsKpis.map((k, i) => {
          const Icon = kpiIcons[i];
          return (
            <div key={k.label} className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between">
                <div className={`h-12 w-12 rounded-xl grid place-items-center ${kpiTones[i]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-medium ${k.positive ? "text-emerald-600" : "text-destructive"}`}>{k.change}</span>
              </div>
              <div className="mt-6 text-xs uppercase tracking-[0.15em] text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-serif text-primary">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue trends */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-xl text-foreground">Revenue Trends</h2>
              <p className="text-sm text-muted-foreground mt-1">Monthly revenue performance across all channels</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> CURRENT</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-soft" /> PREVIOUS</span>
            </div>
          </div>
          <RevenueChart />
        </div>

        {/* Categories */}
        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] flex flex-col">
          <h2 className="font-serif text-xl text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">Performance: Onesies vs Accessories</p>

          <div className="mt-6 space-y-5 flex-1">
            {categoryPerformance.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="font-medium" style={{ color: c.color }}>{c.value}</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-muted/40 p-4 flex gap-3">
            <Lightbulb className="h-5 w-5 text-[color:var(--color-gold)] shrink-0" />
            <p className="text-xs text-foreground/80">
              <span className="font-semibold">Insight:</span> "Onesies" sales are up 14% this week. Consider featuring "Midnight Blue" in the hero section.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-xl text-foreground">Customer Acquisition</h2>
          <div className="mt-6 flex items-center gap-8">
            <DonutChart segments={acquisition} total="1.2k" />
            <div className="flex-1 space-y-3">
              {acquisition.map((a) => (
                <div key={a.source} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: a.color }} />{a.source}</span>
                  <span className="font-medium">{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-foreground">Recent Reports</h2>
            <a className="text-sm text-primary font-medium">View All</a>
          </div>
          <div className="mt-5 space-y-3">
            {recentReports.map((r) => (
              <div key={r.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/40">
                <div className="h-10 w-10 rounded-xl bg-primary-soft grid place-items-center text-primary"><FileText className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.meta}</div>
                </div>
                <button className="text-muted-foreground hover:text-primary"><DownloadCloud className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueChart() {
  const max = Math.max(...revenueTrend.map((r) => r.current));
  const points = revenueTrend.map((r, i) => {
    const x = (i / (revenueTrend.length - 1)) * 100;
    const y = 100 - (r.current / max) * 80;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,100 ${points} 100,100`;

  return (
    <div className="mt-6">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-56">
        <defs>
          <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#rev)" />
        <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="grid grid-cols-7 mt-3 text-xs text-muted-foreground">
        {revenueTrend.map((r) => <span key={r.month} className="text-center">{r.month}</span>)}
      </div>
    </div>
  );
}

function DonutChart({ segments, total }: { segments: { source: string; pct: number; color: string }[]; total: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="14" />
        {segments.map((s) => {
          const len = (s.pct / 100) * c;
          const el = (
            <circle
              key={s.source}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-serif text-2xl text-primary">{total}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
        </div>
      </div>
    </div>
  );
}
