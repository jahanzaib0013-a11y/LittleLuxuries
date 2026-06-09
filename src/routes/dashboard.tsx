// Dashboard Route
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { whatsappService } from "@/lib/whatsapp-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Dialogs\\\\\\\

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Plus,
  Tag,
  ShoppingCart,
  DollarSign,
  UserPlus,
  Package,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Download,
} from "lucide-react";
import { dailySales, monthlySales, topSellers } from "@/lib/admin-data";
import {
  orderService,
  type OrderWithItems,
  type OrderStatus,
  type PaymentStatus,
  canMarkOrderPacked,
  canMarkOrderShipped,
  canMarkOrderDelivered,
} from "@/lib/order-service";
import { formatPkr } from "@/lib/format-currency";
import { useDashboardSummary } from "@/lib/dashboard-queries";
import { VIPPulseFeed } from "@/components/vip-pulse-feed";
import { AddProductModal } from "@/components/add-product-modal";
import { OrderTimelineModal } from "@/components/order-timeline-modal";
import { sendOrderStatusEmail } from "@/lib/email.server";
import logo from "@/assets/logo.png";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  sheetModalClass,
  modalFooterClass,
  modalScrollPaneClass,
} from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ExportMenu } from "@/components/export-menu";

declare global {
  interface Window {
    triggerDashboardExportCSV?: () => void;
    triggerDashboardExportPDF?: () => void;
  }
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Little Luxuries Admin" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  return (
    <>
      <AdminLayout
        searchPlaceholder="Search orders, customers, or items…"
        rightSlot={
          <>
            <ExportMenu
              onExportCSV={() => window.triggerDashboardExportCSV?.()}
              onExportPDF={() => window.triggerDashboardExportPDF?.()}
            />
            <Button className="rounded-full h-10" onClick={() => setIsAddProductOpen(true)}>
              <Plus className="h-4 w-4" /> Add Product
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10"
              onClick={() => navigate({ to: "/coupons" })}
            >
              <Tag className="h-4 w-4" /> Add Coupon
            </Button>
          </>
        }
      >
        <DashboardContent />
      </AdminLayout>
      <AddProductModal
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onProductAdded={() => setIsAddProductOpen(false)}
      />
    </>
  );
}

const statIcons = [ShoppingCart, DollarSign, UserPlus, Package];
const toneBg: Record<string, string> = {
  lilac: "bg-primary-soft text-primary",
  blush: "bg-blush/40 text-[color:var(--color-secondary)]",
  gold: "bg-gold/25 text-(--color-gold-foreground)",
};

function DashboardContent() {
  const [period, setPeriod] = useState<"Weekly" | "Monthly">("Weekly");
  const [page, setPage] = useState(1);
  const ordersPerPage = 5;
  const { data, isPending, refetch } = useDashboardSummary(page, ordersPerPage);
  const recentOrders = data?.recentOrders ?? [];
  const stats = data?.stats ?? {
    total_orders: 0,
    total_revenue: 0,
    new_customers: 0,
    low_stock_alerts: 0,
  };
  const realTopSellers = data?.topSellers ?? topSellers;
  const isLoading = isPending && !data;

  const [orderToDelete, setOrderToDelete] = useState<OrderWithItems | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

  const chartData = period === "Weekly" ? dailySales : monthlySales;
  const max = Math.max(...chartData.map((d) => d.value));

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const orderToNotify = recentOrders.find((o) => o.id === orderId);
      await orderService.updateOrderStatus(orderId, status);
      // Send the status email from the component (runs as a real server RPC).
      if (orderToNotify && status !== orderToNotify.status) {
        try {
          await (sendOrderStatusEmail as any)({
            data: {
              orderNumber: orderToNotify.order_number,
              customerEmail: orderToNotify.customer_email,
              customerName: `${orderToNotify.customer_first_name} ${orderToNotify.customer_last_name}`,
              status,
              trackingNumber: orderToNotify.tracking_number,
            },
          });
        } catch (e) {
          console.error("status email failed:", e);
        }
      }
      await refetch();
      toast.success(`Order status updated to ${status}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  const handleUpdatePayment = async (orderId: string, paymentStatus: PaymentStatus) => {
    try {
      const orderToNotify = recentOrders.find((o) => o.id === orderId);
      const shouldMoveToPending =
        paymentStatus === "pending" && orderToNotify?.status === "delivered";

      await orderService.updatePaymentStatus(orderId, paymentStatus, {
        orderStatus: shouldMoveToPending ? "pending_payment" : undefined,
      });

      // Completing payment advances the order to payment_confirmed (unless it's
      // mid-fulfilment/terminal). Send that COD "payment received" email here.
      const skip = ["packed", "shipped", "payment_confirmed", "cancelled", "refunded"];
      if (orderToNotify && paymentStatus === "completed" && !skip.includes(orderToNotify.status)) {
        try {
          await (sendOrderStatusEmail as any)({
            data: {
              orderNumber: orderToNotify.order_number,
              customerEmail: orderToNotify.customer_email,
              customerName: `${orderToNotify.customer_first_name} ${orderToNotify.customer_last_name}`,
              status: "payment_confirmed",
            },
          });
        } catch (e) {
          console.error("payment email failed:", e);
        }
      }

      await refetch();
      toast.success(`Payment status updated to ${paymentStatus}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update payment status");
    }
  };

  const handleWhatsAppClick = (order: OrderWithItems) => {
    const phone = order.customer_phone;
    if (!phone) {
      toast.error("Customer phone number is missing");
      return;
    }

    // 1. Generate the professional, tier-aware message using the service
    const message = whatsappService.formatConfirmationMessage({
      customerName: order.customer_first_name,
      orderNumber: order.order_number,
      items:
        order.order_items?.map((item) => ({
          name: item.product_name,
          quantity: item.quantity,
        })) || [],
      total: order.total_amount,
      tier: (order as { customer_tier?: string }).customer_tier,
    });

    // 2. Open WhatsApp IMMEDIATELY using the service link generator
    const link = whatsappService.getWhatsAppLink(phone, message);
    window.open(link, "_blank");

    // 3. Record that WhatsApp was sent and refresh in background
    (async () => {
      try {
        await orderService.recordWhatsAppSent(order.id);
        await refetch();
      } catch (err) {
        console.error("Failed to record WhatsApp status:", err);
      }
    })();
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const { success, error } = await orderService.deleteOrder(orderToDelete.id);
      if (!success) {
        toast.error(error || "Could not delete order");
        return;
      }
      toast.success(`Order ${orderToDelete.order_number} deleted`);
      setOrderToDelete(null);
      await refetch();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = useCallback(() => {
    if (recentOrders.length === 0) {
      toast.error("No recent orders to export");
      return;
    }

    const headers = ["Order Number", "Customer", "Date", "Total Amount", "Status"];
    const escapeCSV = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return "";
      const s = String(val).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const rows = recentOrders.map((o) => [
      escapeCSV(o.order_number),
      escapeCSV(`${o.customer_first_name} ${o.customer_last_name}`),
      escapeCSV(new Date(o.created_at).toLocaleDateString()),
      escapeCSV(o.total_amount),
      escapeCSV(o.status),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `little_luxuries_dashboard_recent_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dashboard data exported successfully");
  }, [recentOrders]);

  const handleExportPDF = useCallback(() => {
    if (recentOrders.length === 0) {
      toast.error("No recent orders to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Little Luxuries — Executive Dashboard Summary", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

    // Stats Table
    doc.setFontSize(14);
    doc.text("Business Performance Snapshot", 14, 40);
    const statsBody = [
      ["Total Orders", stats.total_orders.toLocaleString(), "+12%"],
      ["Revenue (Collected)", formatPkr(stats.total_revenue), "+8%"],
      ["New Customers", stats.new_customers.toString(), "+24%"],
    ];
    autoTable(doc, {
      startY: 45,
      head: [["KPI", "Value", "Growth"]],
      body: statsBody,
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 9 },
    });

    // Recent Orders Table
    doc.setFontSize(14);
    doc.text(
      "Recent Transactions",
      14,
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15,
    );
    const orderBody = recentOrders.map((o) => [
      o.order_number,
      `${o.customer_first_name} ${o.customer_last_name}`,
      new Date(o.created_at).toLocaleDateString(),
      formatPkr(Number(o.total_amount)),
      o.status.toUpperCase(),
    ]);
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20,
      head: [["Order #", "Customer", "Date", "Amount", "Status"]],
      body: orderBody,
      headStyles: { fillColor: [212, 175, 55] },
      styles: { fontSize: 9 },
    });

    doc.save(`little_luxuries_dashboard_summary_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Executive PDF Summary generated");
  }, [recentOrders, stats.total_orders, stats.total_revenue, stats.new_customers]);

  useEffect(() => {
    window.triggerDashboardExportCSV = handleExportCSV;
    window.triggerDashboardExportPDF = handleExportPDF;
  }, [handleExportCSV, handleExportPDF]);

  // Dynamic dashboard stats based on real data
  const dynamicStats = [
    {
      label: "Total Orders",
      value: stats.total_orders.toLocaleString(),
      change: "+12%",
      trend: "up" as const,
      tone: "lilac" as const,
    },
    {
      label: "Revenue (collected)",
      value: formatPkr(stats.total_revenue),
      change: "+8%",
      trend: "up" as const,
      tone: "blush" as const,
    },
    {
      label: "New Customers",
      value: stats.new_customers.toString(),
      change: "+24%",
      trend: "up" as const,
      tone: "gold" as const,
    },
    {
      label: "Low Stock Alerts",
      value: stats.low_stock_alerts.toString(),
      change: "Needs Restock",
      trend: "warn" as const,
      tone: "blush" as const,
    },
  ];

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of orders, revenue, and VIP activity
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {dynamicStats.map((s, i) => {
          const Icon = statIcons[i];
          return (
            <div key={s.label} className="rounded-2xl bg-card p-4 shadow-(--shadow-card) sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`h-11 w-11 shrink-0 rounded-xl grid place-items-center sm:h-12 sm:w-12 ${toneBg[s.tone]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`shrink-0 text-right text-xs font-medium ${s.trend === "warn" ? "text-destructive" : "text-emerald-600"}`}
                >
                  {s.change} {s.trend === "up" && "↗"}
                </span>
              </div>
              <div className="mt-6 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-1 text-2xl font-serif text-foreground">
                {isLoading ? <Skeleton className="h-8 w-24" /> : s.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Sales chart */}
        <div className="min-w-0 rounded-2xl bg-card p-4 shadow-(--shadow-card) sm:p-6 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-serif text-2xl text-foreground">Daily Sales Performance</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time overview of transaction volume
              </p>
            </div>
            <div className="inline-flex w-full max-w-full rounded-full bg-muted p-1 text-xs sm:w-auto">
              {(["Weekly", "Monthly"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`flex-1 px-3 py-1.5 rounded-full transition sm:flex-none sm:px-4 ${period === p ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="hide-scrollbar mt-6 -mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0 sm:overflow-visible">
            <div
              className={`grid h-44 min-w-[280px] items-end gap-1 sm:h-56 sm:gap-2 ${period === "Weekly" ? "grid-cols-7" : "grid-cols-4 md:grid-cols-6"}`}
            >
              {chartData.map((d) => (
                <div
                  key={d.day}
                  className="flex min-w-0 flex-col items-center gap-1.5 h-full justify-end sm:gap-2"
                >
                  <div
                    className={`w-full min-h-[4px] rounded-t-lg transition-all duration-500 ${d.value === max ? "bg-primary" : "bg-primary/15"}`}
                    style={{ height: `${max > 0 ? (d.value / max) * 100 : 0}%` }}
                  />
                  <span className="w-full truncate text-center text-[9px] text-muted-foreground sm:text-[10px]">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top sellers */}
        <div className="flex min-w-0 flex-col rounded-2xl bg-card p-4 shadow-(--shadow-card) sm:p-6">
          <div className="flex-1">
            <h2 className="font-serif text-2xl text-foreground">Top Sellers</h2>
            <div className="mt-6 space-y-4">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={`ts-skel-${i}`} className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-10 mb-1 ml-auto" />
                        <Skeleton className="h-3 w-8 ml-auto" />
                      </div>
                    </div>
                  ))
                : realTopSellers.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-xl grid place-items-center ${i === 0 ? "bg-primary-soft" : i === 1 ? "bg-blush/40" : "bg-gold/20"}`}
                      >
                        <img src={logo} alt="" className="h-7 w-7 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.collection}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-primary font-semibold">{p.sales}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Sales
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-6 w-full shrink-0 rounded-full border-dashed"
            asChild
          >
            <Link to="/products">View All Products</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Recent orders */}
        <div className="min-w-0 rounded-2xl bg-card p-4 shadow-(--shadow-card) sm:p-6 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-xl text-foreground sm:text-2xl">Recent Orders</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary self-start sm:self-auto"
            >
              View Reports <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>
          <div className="hide-scrollbar mt-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.15em] text-muted-foreground border-b border-border">
                  <th className="text-left font-medium py-3">Order ID</th>
                  <th className="text-left font-medium py-3">Customer</th>
                  <th className="text-left font-medium py-3">Date</th>
                  <th className="text-left font-medium py-3">Items</th>
                  <th className="text-left font-medium py-3">Total</th>
                  <th className="text-left font-medium py-3">Status</th>
                  <th className="text-right font-medium py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-border/50">
                      <td className="py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </td>
                      <td className="py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="py-4">
                        <Skeleton className="h-8 w-16 rounded-full" />
                      </td>
                      <td className="py-4">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="py-4">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </td>
                      <td className="py-4 text-right">
                        <Skeleton className="h-4 w-4 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <p className="text-sm">No orders yet</p>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 last:border-0">
                      <td className="py-4 text-primary font-medium">{o.order_number}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${
                              o.status === "order_placed"
                                ? "bg-blue-100 text-blue-700"
                                : o.status === "pending_payment"
                                  ? "bg-amber-100 text-amber-700"
                                  : o.status === "shipped"
                                    ? "bg-primary-soft text-primary"
                                    : o.status === "packed"
                                      ? "bg-indigo-100 text-indigo-700"
                                      : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {getInitials(o.customer_first_name, o.customer_last_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-foreground truncate">
                                {o.customer_first_name} {o.customer_last_name}
                              </div>
                              {o.customer_phone &&
                                !o.order_status_history?.some(
                                  (h) => h.status === "whatsapp_sent",
                                ) && (
                                  <button
                                    onClick={() => handleWhatsAppClick(o)}
                                    className="text-[#25D366] hover:scale-110 transition-transform p-1 hover:bg-[#25D366]/10 rounded-md cursor-pointer"
                                    title="Chat on WhatsApp"
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4 fill-current"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                  </button>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {o.customer_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-muted-foreground">{formatDate(o.created_at)}</td>
                      <td
                        className="py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsItemsModalOpen(true);
                        }}
                      >
                        <div className="flex -space-x-2.5 overflow-hidden">
                          {o.order_items
                            ?.slice(0, 3)
                            .map(
                              (
                                item: { product_name: string; product_image_url?: string | null },
                                idx: number,
                              ) => (
                                <div
                                  key={`${o.id}-img-${idx}`}
                                  className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted overflow-hidden shrink-0"
                                  title={item.product_name}
                                >
                                  {item.product_image_url ? (
                                    <img
                                      src={item.product_image_url}
                                      alt={item.product_name}
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold">
                                      {item.product_name?.substring(0, 1)}
                                    </div>
                                  )}
                                </div>
                              ),
                            )}
                          {o.order_items && o.order_items.length > 3 && (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-background bg-muted text-[10px] font-bold text-muted-foreground">
                              +{o.order_items.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 font-medium text-foreground">
                        {formatPkr(Number(o.total_amount))}
                      </td>
                      <td className="py-4">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl shadow-(--shadow-card)"
                          >
                            <DropdownMenuLabel className="font-serif">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to="/orders">View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(o);
                                setIsTimelineOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              View Journey
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {o.status === "delivered" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleUpdatePayment(o.id, "pending")}
                                  className="cursor-pointer text-amber-600 font-medium"
                                >
                                  {o.payment_status === "completed"
                                    ? "Mark as unpaid"
                                    : "Still not paid"}
                                </DropdownMenuItem>
                                {o.payment_status !== "completed" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdatePayment(o.id, "completed")}
                                    className="cursor-pointer text-blue-600 font-medium"
                                  >
                                    Mark as paid
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {o.status === "payment_confirmed" &&
                              o.payment_status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdatePayment(o.id, "completed")}
                                  className="cursor-pointer text-blue-600 font-medium"
                                >
                                  Mark payment completed
                                </DropdownMenuItem>
                              )}
                            {o.status === "pending_payment" && o.payment_status !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdatePayment(o.id, "completed")}
                                className="cursor-pointer text-blue-600 font-medium"
                              >
                                Mark as paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(o.id, "packed")}
                              className="cursor-pointer"
                              disabled={!canMarkOrderPacked(o.status)}
                            >
                              Mark as packed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(o.id, "shipped")}
                              className="cursor-pointer"
                              disabled={!canMarkOrderShipped(o.status)}
                            >
                              Mark as shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(o.id, "delivered")}
                              className={`cursor-pointer ${o.status === "delivered" ? "text-emerald-600" : ""}`}
                              disabled={!canMarkOrderDelivered(o.status)}
                            >
                              Mark as delivered
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(o.id, "cancelled")}
                              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              Cancel Order
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setOrderToDelete(o)}
                              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2 inline-block align-middle" />
                              Delete order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex flex-col gap-3 border-t border-border/50 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {recentOrders.length > 0
                ? `Showing ${(page - 1) * ordersPerPage + 1} to ${Math.min(page * ordersPerPage, stats.total_orders)} of ${stats.total_orders} orders`
                : "No orders"}
            </div>
            <div className="flex items-center justify-center gap-1 sm:justify-end">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted disabled:opacity-50 transition"
              >
                ‹
              </button>
              <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {page}
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * ordersPerPage >= stats.total_orders}
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted disabled:opacity-50 transition"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* VIP Pulse Feed */}
        <div className="min-w-0">
          <VIPPulseFeed />
        </div>
      </div>

      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={(open) => !open && !isDeleting && setOrderToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes order{" "}
              <span className="font-semibold text-foreground">{orderToDelete?.order_number}</span>{" "}
              and its line items from the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={isDeleting}
              onClick={() => void handleConfirmDeleteOrder()}
            >
              {isDeleting ? "Deleting…" : "Delete order"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderTimelineModal
        isOpen={isTimelineOpen}
        onOpenChange={setIsTimelineOpen}
        order={selectedOrder as OrderWithItems}
      />

      <Dialog open={isItemsModalOpen} onOpenChange={setIsItemsModalOpen}>
        <DialogContent className={cn(sheetModalClass, "min-h-0 bg-card")}>
          <ModalCloseBar onClose={() => setIsItemsModalOpen(false)} />
          <div className="shrink-0 border-b border-border bg-muted/30 p-4 sm:p-6">
            <h3 className="font-serif text-lg text-foreground sm:text-xl">Order Items</h3>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">Order #{selectedOrder?.order_number}</p>
              {selectedOrder?.tracking_number && (
                <p className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  {selectedOrder.tracking_number}
                </p>
              )}
            </div>
          </div>
          <div className={cn(modalScrollPaneClass, "space-y-4 px-3 py-4 sm:px-6")}>
            {selectedOrder?.order_items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0 ring-1 ring-border group-hover:ring-primary/30 transition-all">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      ✨
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {item.product_name}
                  </h4>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity || 1}</p>
                </div>
                <div className="text-sm font-semibold text-primary">
                  {formatPkr(Number(item.unit_price || 0))}
                </div>
              </div>
            ))}
          </div>
          <div className={cn(modalFooterClass, "flex items-center justify-between bg-muted/30")}>
            <span className="text-sm font-medium text-muted-foreground">Total Value</span>
            <span className="text-lg font-serif text-foreground">
              {formatPkr(Number(selectedOrder?.total_amount || 0))}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    order_placed: "bg-blue-100 text-blue-700",
    order_confirmed: "bg-emerald-100 text-emerald-700",
    payment_confirmed: "bg-indigo-100 text-indigo-700",
    pending_payment: "bg-gold/25 text-(--color-gold-foreground)",
    payment_initiated: "bg-blue-100 text-blue-700",
    paid: "bg-blue-100 text-blue-700",
    packed: "bg-indigo-100 text-indigo-700",
    shipped: "bg-primary-soft text-primary",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${styles[status] ?? "bg-muted"}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
