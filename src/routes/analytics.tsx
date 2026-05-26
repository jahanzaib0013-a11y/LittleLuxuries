import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { formatPkr } from "@/lib/format-currency";
import {
  DollarSign,
  ShoppingCart,
  UserPlus,
  TrendingUp,
  Calendar,
  Lightbulb,
  FileText,
  DownloadCloud,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getAnalyticsKPIs,
  getRevenueTrends,
  getOrderStatusBreakdown,
  getCustomerAcquisition,
} from "@/lib/analytics";
import {
  getAllReports,
  verifyReportPassword,
  createPasswordProtectedDownload,
} from "@/lib/comprehensive-reports";
import { ReportPasswordModal } from "@/components/report-password-modal";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ExportMenu } from "@/components/export-menu";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Little Luxuries Admin" }] }),
  component: AnalyticsPageMain,
});

function AnalyticsPageMain() {
  return (
    <AdminLayout searchPlaceholder="Search analytics…" rightSlot={<AnalyticsHeaderActions />}>
      <AnalyticsPage />
    </AdminLayout>
  );
}

const kpiIcons = [DollarSign, ShoppingCart, UserPlus, TrendingUp];
const kpiTones = [
  "bg-primary-soft text-primary",
  "bg-blush/40 text-[color:var(--color-secondary)]",
  "bg-gold/25 text-(--color-gold-foreground)",
  "bg-muted text-foreground",
];
const periods = ["Last 30 Days", "Last Quarter", "Custom Range"] as const;

function AnalyticsPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("Last 30 Days");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "sales" | "inventory">("all");

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const customRange =
    period === "Custom Range" && dateRange?.from && dateRange?.to
      ? { start: dateRange.from, end: dateRange.to }
      : undefined;

  // Fetch real analytics data
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["analytics-kpis", period, customRange],
    queryFn: () => getAnalyticsKPIs(period, customRange),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-trends", period, customRange],
    queryFn: () => getRevenueTrends(period, customRange),
  });

  const { data: orderStatuses } = useQuery({
    queryKey: ["order-status-breakdown"],
    queryFn: getOrderStatusBreakdown,
  });

  const { data: acquisitionData } = useQuery({
    queryKey: ["customer-acquisition", period, customRange],
    queryFn: () => getCustomerAcquisition(period, customRange),
  });

  const { data: reports } = useQuery({
    queryKey: ["recent-reports"],
    queryFn: getAllReports,
  });

  const handleExportCSV = useCallback(() => {
    if (!kpis) {
      toast.error("No analytics data to export");
      return;
    }

    const headers = ["Metric", "Value", "Change", "Status"];
    const escapeCSV = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const s = String(val).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const rows = kpis.map(
      (k: { label: string; value: string; change: string; positive: boolean }) => [
        escapeCSV(k.label),
        escapeCSV(k.value),
        escapeCSV(k.change),
        escapeCSV(k.positive ? "Positive" : "Negative"),
      ],
    );

    // Add trend data if available
    if (revenueData && revenueData.length > 0) {
      rows.push([]); // empty row
      rows.push(["Revenue Trend (Monthly)"]);
      rows.push(["Month", "Current Revenue", "Previous Revenue"]);
      revenueData.forEach((r: { month: string; current: number; previous: number }) => {
        rows.push([escapeCSV(r.month), escapeCSV(r.current), escapeCSV(r.previous)]);
      });
    }

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `little_luxuries_analytics_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics data exported successfully");
  }, [kpis, revenueData]);

  const handleExportPDF = useCallback(() => {
    if (!kpis) {
      toast.error("No analytics data to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Little Luxuries — Business Intelligence Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

    // KPI Table
    doc.setFontSize(14);
    doc.text("Key Performance Indicators", 14, 40);
    const kpiBody = kpis.map(
      (k: { label: string; value: string; change: string; positive: boolean }) => [
        k.label,
        k.value,
        k.change,
        k.positive ? "GROWTH" : "DECLINE",
      ],
    );
    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value", "Trend", "Status"]],
      body: kpiBody,
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 9 },
    });

    // Revenue Trend Table
    if (revenueData && revenueData.length > 0) {
      doc.setFontSize(14);
      doc.text(
        "Monthly Revenue Performance",
        14,
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15,
      );
      const trendBody = revenueData.map(
        (r: { month: string; current: number; previous: number }) => [
          r.month,
          formatPkr(r.current),
          formatPkr(r.previous),
          `${(((r.current - r.previous) / (r.previous || 1)) * 100).toFixed(1)}%`,
        ],
      );
      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20,
        head: [["Month", "Current", "Previous", "YoY Change"]],
        body: trendBody,
        headStyles: { fillColor: [212, 175, 55] }, // gold color
        styles: { fontSize: 9 },
      });
    }

    doc.save(`little_luxuries_analytics_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Analytics PDF Report generated");
  }, [kpis, revenueData]);

  useEffect(() => {
    const win = window as typeof window & {
      triggerAnalyticsExportCSV?: () => void;
      triggerAnalyticsExportPDF?: () => void;
    };
    win.triggerAnalyticsExportCSV = handleExportCSV;
    win.triggerAnalyticsExportPDF = handleExportPDF;
    return () => {
      delete win.triggerAnalyticsExportCSV;
      delete win.triggerAnalyticsExportPDF;
    };
  }, [handleExportCSV, handleExportPDF]);

  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    reportName: string;
    reportData: import("@/lib/comprehensive-reports").ReportData | null;
    isLoading: boolean;
    error: string;
  }>({
    isOpen: false,
    reportName: "",
    reportData: null,
    isLoading: false,
    error: "",
  });

  const handleDownloadReport = (report: import("@/lib/comprehensive-reports").ReportData) => {
    setPasswordModal({
      isOpen: true,
      reportName: report.name,
      reportData: report,
      isLoading: false,
      error: "",
    });
  };

  const handlePasswordSubmit = async (password: string) => {
    setPasswordModal((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      if (verifyReportPassword(password)) {
        if (!passwordModal.reportData) {
          throw new Error("Report data is missing.");
        }

        // Create download link
        const downloadUrl = await createPasswordProtectedDownload(passwordModal.reportData);

        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = passwordModal.reportData.name;
        link.style.display = "none";
        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);

        // Close modal after successful download
        setTimeout(() => {
          setPasswordModal((prev) => ({
            ...prev,
            isOpen: false,
            error: "",
            reportName: "",
            reportData: null,
          }));
        }, 500);
      } else {
        setPasswordModal((prev) => ({
          ...prev,
          isLoading: false,
          error: "Incorrect password",
        }));
      }
    } catch (error) {
      console.error("Download error:", error);
      setPasswordModal((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to download report. Please try again.",
      }));
    }
  };

  const handleClosePasswordModal = () => {
    setPasswordModal((prev) => ({
      ...prev,
      isOpen: false,
      error: "",
      reportName: "",
      reportData: null,
    }));
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (kpisLoading || revenueLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="inline-flex">
            <Skeleton className="h-10 w-72 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="lg:col-span-2 h-[350px] w-full rounded-2xl" />
          <Skeleton className="h-[350px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

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
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {period === "Custom Range" && (
            <DatePickerWithRange
              date={dateRange}
              onApply={setDateRange}
              className="animate-in fade-in slide-in-from-right-2 duration-300 w-full sm:w-auto"
            />
          )}
          <div className="inline-flex flex-wrap bg-card rounded-full p-1 shadow-(--shadow-card) max-w-full overflow-x-auto">
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
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis?.map(
          (k: { label: string; value: string; change: string; positive: boolean }, i: number) => {
            const Icon = kpiIcons[i];
            return (
              <div key={k.label} className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-xl grid place-items-center ${kpiTones[i]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-medium ${k.positive ? "text-emerald-600" : "text-destructive"}`}
                  >
                    {k.change}
                  </span>
                </div>
                <div className="mt-6 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {k.label}
                </div>
                <div className="mt-1 text-2xl font-serif text-primary">{k.value}</div>
              </div>
            );
          },
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue trends */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-(--shadow-card)">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-xl text-foreground">Revenue Trends</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Monthly revenue performance across all channels
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> CURRENT
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary-soft" /> PREVIOUS
              </span>
            </div>
          </div>
          <RevenueChart data={revenueData || []} />
        </div>

        {/* Order Status */}
        <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card) flex flex-col">
          <h2 className="font-serif text-xl text-foreground">Order Status</h2>
          <p className="text-sm text-muted-foreground mt-1">Placed, Delivered &amp; Cancelled</p>

          <div className="mt-6 space-y-5 flex-1">
            {orderStatuses?.map((s) => {
              const StatusIcon = s.label === "Placed" ? Package : s.label === "Delivered" ? CheckCircle : XCircle;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" style={{ color: s.color }} />
                      {s.label}
                    </span>
                    <span className="font-medium" style={{ color: s.color }}>
                      {s.count} orders · {s.pct}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-muted/40 p-4 flex gap-3">
            <Lightbulb className="h-5 w-5 text-gold shrink-0" />
            <p className="text-xs text-foreground/80">
              <span className="font-semibold">Tip:</span> These counts are live from your database. Update order statuses from the Orders page.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
          <h2 className="font-serif text-xl text-foreground">Customer Acquisition</h2>
          <div className="mt-6 flex flex-wrap items-center gap-6 sm:gap-8">
            <DonutChart segments={acquisitionData || []} total="1.2k" />
            <div className="flex-1 min-w-0 sm:min-w-[180px] space-y-3">
              {acquisitionData?.map((a: { source: string; pct: number; color: string }) => (
                <div key={a.source} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                    {a.source}
                  </span>
                  <span className="font-medium">{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-foreground">All Reports</h2>
            <div className="flex gap-2">
              {(["all", "sales", "inventory"] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full capitalize transition ${
                    selectedCategory === category
                      ? "bg-primary-soft text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3 max-h-96 overflow-y-auto">
            {reports
              ?.filter(
                (r: import("@/lib/comprehensive-reports").ReportData) =>
                  selectedCategory === "all" || r.category === selectedCategory,
              )
              .map((r: import("@/lib/comprehensive-reports").ReportData) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/40"
                >
                  <div
                    className={`h-10 w-10 rounded-xl grid place-items-center text-white ${
                      r.category === "sales"
                        ? "bg-blue-500"
                        : r.category === "inventory"
                          ? "bg-green-500"
                          : r.category === "marketing"
                            ? "bg-purple-500"
                            : "bg-orange-500"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.description} • Generated {getTimeAgo(r.generatedAt)} • {r.size}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          r.format === "pdf"
                            ? "bg-red-100 text-red-700"
                            : r.format === "excel"
                              ? "bg-green-100 text-green-700"
                              : r.format === "csv"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {r.format.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                        {r.schedule}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadReport(r)}
                    className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-muted/60"
                    title="Download report (password protected)"
                  >
                    <DownloadCloud className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>

          {reports && reports.length > 0 && (
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              Showing{" "}
              {
                reports?.filter(
                  (r: import("@/lib/comprehensive-reports").ReportData) =>
                    selectedCategory === "all" || r.category === selectedCategory,
                ).length
              }{" "}
              reports
              {selectedCategory !== "all" && ` in ${selectedCategory}`}
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      <ReportPasswordModal
        isOpen={passwordModal.isOpen}
        onClose={handleClosePasswordModal}
        reportName={passwordModal.reportName}
        onPasswordSubmit={handlePasswordSubmit}
        isLoading={passwordModal.isLoading}
        error={passwordModal.error}
      />
    </div>
  );
}

function RevenueChart({ data }: { data: { current: number; month: string; previous: number }[] }) {
  const max = Math.max(...data.map((r) => r.current), 1);
  const points = data
    .map((r, i: number) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (r.current / max) * 80;
      return `${x},${y}`;
    })
    .join(" ");
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
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        className="grid mt-3 text-[10px] sm:text-xs text-muted-foreground gap-1"
        style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 7)}, minmax(0, 1fr))` }}
      >
        {data.map((r) => (
          <span key={r.month} className="text-center truncate px-0.5">
            {r.month}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({
  segments,
  total,
}: {
  segments: { source: string; pct: number; color: string }[];
  total: string;
}) {
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
              cx="50"
              cy="50"
              r={r}
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
function AnalyticsHeaderActions() {
  return (
    <ExportMenu
      label="Export Report"
      onExportCSV={() =>
        (
          window as typeof window & { triggerAnalyticsExportCSV?: () => void }
        ).triggerAnalyticsExportCSV?.()
      }
      onExportPDF={() =>
        (
          window as typeof window & { triggerAnalyticsExportPDF?: () => void }
        ).triggerAnalyticsExportPDF?.()
      }
    />
  );
}
