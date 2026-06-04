import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Filter,
  Download,
  ArrowDownUp,
  Pencil,
  Trash2,
  Calendar,
  History,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { couponService, Coupon } from "@/lib/coupon-service";
import { formatPkr, formatPkrCompact } from "@/lib/format-currency";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ExportMenu } from "@/components/export-menu";
import { AddCouponModal } from "@/components/add-coupon-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Little Luxuries Admin" }] }),
  component: CouponsPage,
});

function CouponsPage() {
  return (
    <AdminLayout searchPlaceholder="Search coupon codes…">
      <CouponsContent />
    </AdminLayout>
  );
}

const tabs = ["All Coupons", "Active", "Expired", "Scheduled"] as const;

function CouponsContent() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All Coupons");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState({ active_offers: 0, total_redeemed: 0, revenue_influence: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [couponsData, statsData] = await Promise.all([
        couponService.getCoupons(),
        couponService.getCouponStats(),
      ]);
      setCoupons(couponsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await couponService.deleteCoupon(deleteTarget);
      toast.success("Boutique offer removed");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    if (tab === "All Coupons") return true;
    return c.status.toLowerCase() === tab.toLowerCase();
  });

  const handleExportCSV = () => {
    if (filteredCoupons.length === 0) {
      toast.error("No coupons to export");
      return;
    }

    const headers = [
      "Coupon Code",
      "Type",
      "Value",
      "Status",
      "Redemptions",
      "Starts At",
      "Expires At",
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return "";
      const s = String(val).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const rows = filteredCoupons.map((c) => [
      escapeCSV(c.code),
      escapeCSV(c.type),
      escapeCSV(c.discount_value),
      escapeCSV(c.status),
      escapeCSV(c.redemptions),
      escapeCSV(c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "N/A"),
      escapeCSV(c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `little_luxuries_coupons_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Coupons exported successfully");
  };

  const handleExportPDF = () => {
    if (filteredCoupons.length === 0) {
      toast.error("No coupons to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Little Luxuries — Promotional Coupons", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

    const body = filteredCoupons.map((c) => [
      c.code,
      c.type.toUpperCase(),
      c.discount_value,
      c.status.toUpperCase(),
      c.redemptions,
      c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "NEVER",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Code", "Type", "Value", "Status", "Uses", "Expires"]],
      body: body,
      headStyles: { fillColor: [139, 92, 246] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9 },
    });

    doc.save(`little_luxuries_coupons_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Coupon PDF Report generated");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-12 w-36 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <div className="rounded-full bg-card p-2 shadow-(--shadow-card) flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Coupon Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your boutique's promotional offers with elegance. Track performance and create
            tailored discounts for your discerning clientele.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button
            className="rounded-full h-12 px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> New Coupon
          </Button>
        </div>
      </div>

      <AddCouponModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onCouponAdded={fetchData}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Active Offers"
          value={stats.active_offers.toString()}
          note="↗ Tracking real-time"
        />
        <StatCard
          label="Total Redeemed"
          value={stats.total_redeemed.toLocaleString()}
          note="✨ Across all campaigns"
          noteColor="text-(--color-gold-foreground)"
        />
        <StatCard
          label="Revenue Influence"
          value={formatPkrCompact(stats.revenue_influence)}
          note="🐷 Estimated savings"
        />
        <div className="rounded-2xl p-6 bg-linear-to-br from-primary to-lilac text-primary-foreground">
          <div className="font-serif text-xl">Seasonal Discounts</div>
          <div className="mt-2 text-sm opacity-90">Prepare for the Autumn Collection launch.</div>
        </div>
      </div>

      <div className="rounded-full bg-card p-2 shadow-(--shadow-card) flex items-center justify-between flex-wrap gap-3">
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
          <button className="inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm hover:bg-muted">
            <Filter className="h-3.5 w-3.5" /> Filter By Type
          </button>
          <button className="inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm hover:bg-muted">
            <ArrowDownUp className="h-3.5 w-3.5" /> Newest First
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCoupons.map((c) => (
          <CouponCard key={c.id} c={c} onDelete={() => setDeleteTarget(c.id)} />
        ))}

        {filteredCoupons.length === 0 && (
          <div className="col-span-full py-12 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
            <div className="font-serif text-xl text-muted-foreground">
              No {tab.toLowerCase()} found.
            </div>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Create a new offer to engage your customers.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredCoupons.length} of {coupons.length} campaigns
        </div>
        <div className="flex items-center gap-1">
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">‹</button>
          <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm">
            1
          </button>
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">›</button>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[32px] p-8 border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 grid place-items-center mb-4">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <AlertDialogTitle className="font-serif text-3xl">
              Remove Boutique Offer?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground mt-2">
              This action will permanently retire this coupon code. Any customers who have saved
              this code will no longer be able to use it at checkout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-full h-12 px-8 border-none hover:bg-muted">
              Keep Offer
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-full h-12 px-8 bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
            >
              {isDeleting ? "Removing..." : "Confirm Removal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  noteColor = "text-emerald-600",
}: {
  label: string;
  value: string;
  note: string;
  noteColor?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
      <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-3xl font-serif text-primary">{value}</div>
      <div className={`mt-3 text-xs ${noteColor}`}>{note}</div>
    </div>
  );
}

function CouponCard({ c, onDelete }: { c: Coupon; onDelete: () => void }) {
  const status = c.status.charAt(0).toUpperCase() + c.status.slice(1);
  const isExpired = status === "Expired";
  const isScheduled = status === "Scheduled";
  const discountLabel =
    c.type === "percentage" ? `${c.discount_value}%` : formatPkr(Number(c.discount_value));

  if (isScheduled) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card) flex flex-col">
        <div className="flex items-start justify-between">
          <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium">
            Scheduled
          </span>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-6 font-serif text-2xl text-primary">{c.code}</div>
        <div className="mt-4 text-sm text-muted-foreground text-left">
          Starts: {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "TBD"}
        </div>
        <div className="mt-2 text-lg font-medium text-left">{discountLabel} Discount</div>
        <div className="mt-auto pt-6 flex gap-2">
          <Button variant="outline" className="flex-1 rounded-full">
            Edit
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl shadow-(--shadow-card) overflow-hidden transition-all hover:scale-[1.01] ${isExpired ? "opacity-60" : ""}`}
    >
      <div className={`p-6 ${isExpired ? "bg-muted" : "bg-primary-soft/50"} relative text-left`}>
        <span
          className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
            isExpired
              ? "bg-muted-foreground/20 text-muted-foreground"
              : "bg-card text-(--color-gold-foreground)"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isExpired ? "bg-muted-foreground" : "bg-gold"}`}
          />
          {status}
        </span>
        <div className="font-serif text-3xl sm:text-4xl lg:text-5xl text-primary/40 leading-none">
          {discountLabel}
        </div>
        <div className="mt-4 font-serif text-2xl text-primary tracking-wider">{c.code}</div>
      </div>
      <div className="bg-card p-5">
        <div className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>Discount Type</span>
          <span>Redemptions</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-medium capitalize">{c.type} Off</span>
          <span className="font-medium">{c.redemptions}</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {isExpired ? <History className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
            <div className="text-left">
              <div>{isExpired ? "Ended On" : "Expires On"}</div>
              <div className="font-medium text-foreground">
                {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isExpired && (
              <button className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-muted-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
