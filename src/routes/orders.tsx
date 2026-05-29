import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { whatsappService } from "@/lib/whatsapp-service";

declare global {
  interface Window {
    triggerOrdersExportCSV?: () => void;
  }
}
import {
  Download,
  Plus,
  Filter,
  Calendar,
  ChevronDown,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { OrderTimelineModal } from "@/components/order-timeline-modal";
import { AddOrderModal } from "@/components/add-order-modal";
import { CommunicationLevelModal } from "@/components/communication-level-modal";
import { sendOrderStatusEmail } from "@/lib/email.server";
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
import { HorizontalScrollArea } from "@/components/horizontal-scroll-area";
import { cn } from "@/lib/utils";
import { sheetModalClass, modalFooterClass, modalScrollPaneClass } from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";

const REVENUE_TARGET_PKR = 800_000;

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders & Shipping — Little Luxuries Admin" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <AdminLayout searchPlaceholder="Search by Order ID, Customer…">
      <OrdersContent />
    </AdminLayout>
  );
}

const tabs = [
  "All Orders",
  "order_placed",
  "order_confirmed",
  "packed",
  "shipped",
  "delivered",
  "pending_payment",
  "payment_confirmed",
  "cancelled",
] as const;

function OrdersContent() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All Orders");
  const [dateFilter, setDateFilter] = useState<
    "All Time" | "Last 7 Days" | "Last 30 Days" | "This Year"
  >("Last 30 Days");
  const [paymentFilter, setPaymentFilter] = useState<"All" | "completed" | "pending" | "failed">(
    "All",
  );
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderWithItems | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_fulfillment: 0,
    avg_monthly_earning: 0,
    revenue_mtd: 0,
    order_placed: 0,
    order_confirmed: 0,
    payment_confirmed: 0,
    pending_payment: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusFilter = tab === "All Orders" ? undefined : tab;
      
      const fromDate = new Date();
      if (dateFilter === "Last 7 Days") fromDate.setDate(fromDate.getDate() - 7);
      else if (dateFilter === "Last 30 Days") fromDate.setDate(fromDate.getDate() - 30);
      else if (dateFilter === "This Year") fromDate.setMonth(0, 1);
      
      const dateRange =
        dateFilter !== "All Time"
          ? { from: fromDate.toISOString(), to: new Date().toISOString() }
          : undefined;

      const { orders: data, error: fetchError } = await orderService.getAllOrders({
        status: statusFilter,
        payment_status: paymentFilter === "All" ? undefined : paymentFilter,
        dateRange,
        limit: 50,
      });

      if (fetchError) throw new Error(fetchError);
      setOrders(data);

      // Fetch stats
      const statsData = await orderService.getOrderStats();
      if (!statsData.error) {
        setStats({
          total_orders: statsData.total_orders,
          pending_fulfillment: statsData.pending_payment + statsData.payment_confirmed + statsData.packed,
          avg_monthly_earning: statsData.revenue_mtd, // Fallback to MTD for now, can be refined later
          revenue_mtd: statsData.revenue_mtd,
          order_placed: statsData.order_placed,
          order_confirmed: statsData.order_confirmed || 0,
          payment_confirmed: statsData.payment_confirmed || 0,
          pending_payment: statsData.pending_payment,
          packed: statsData.packed,
          shipped: statsData.shipped,
          delivered: statsData.delivered,
          cancelled: statsData.cancelled,
        });
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || "Failed to fetch orders";
      console.error("Error fetching orders:", err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tab, dateFilter, paymentFilter]);

  const handleWhatsAppClick = (order: OrderWithItems) => {
    const phone = order.customer_phone;
    if (!phone) {
      toast.error("Customer phone number is missing");
      return;
    }

    // 1. Generate the professional message using the centralized service
    const message = whatsappService.formatConfirmationMessage({
      customerName: order.customer_first_name,
      orderNumber: order.order_number,
      items: order.order_items?.map((item) => ({ name: item.product_name })) || [],
      trackingUrl: `${window.location.origin}/track/${order.order_number}`,
      trackingNumber: order.tracking_number,
    });

    // 2. Open WhatsApp IMMEDIATELY using the service link generator
    const link = whatsappService.getWhatsAppLink(phone, message);
    window.open(link, "_blank");

    // 3. Record in background
    (async () => {
      try {
        await orderService.recordWhatsAppSent(order.id);
        fetchOrders();
      } catch (err) {
        console.error("Failed to record WhatsApp status:", err);
      }
    })();
  };

  const handleDeleteOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) setOrderToDelete(order);
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, status);

      // AUTOMATION: Automatically send confirmation email for key status changes
      const orderToNotify = orders.find((o) => o.id === orderId);
      if (orderToNotify && ["packed", "shipped", "delivered"].includes(status)) {
        try {
          await sendOrderStatusEmail({
            data: {
              orderNumber: orderToNotify.order_number,
              customerEmail: orderToNotify.customer_email,
              customerName: `${orderToNotify.customer_first_name} ${orderToNotify.customer_last_name}`,
              status: status as "packed" | "shipped" | "delivered",
              trackingNumber: orderToNotify.tracking_number,
            },
          });
          toast.success(`Automated email sent for ${status} status`);
        } catch (emailErr) {
          console.error("Failed to send automated email:", emailErr);
        }
      }

      fetchOrders();
      toast.success(`Order status updated to ${status}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  const handleUpdatePayment = async (orderId: string, paymentStatus: any) => {
    try {
      const orderToNotify = orders.find((o) => o.id === orderId);
      const shouldMoveToPending = paymentStatus === "pending" && orderToNotify?.status === "delivered";

      await orderService.updatePaymentStatus(orderId, paymentStatus, {
        orderStatus: shouldMoveToPending ? "pending_payment" : undefined,
      });

      // AUTOMATION: Automatically send email for "paid"/"completed" status
      if (orderToNotify && (paymentStatus === "paid" || paymentStatus === "completed")) {
        try {
          await sendOrderStatusEmail({
            data: {
              orderNumber: orderToNotify.order_number,
              customerEmail: orderToNotify.customer_email,
              customerName: `${orderToNotify.customer_first_name} ${orderToNotify.customer_last_name}`,
              status: "paid", // Normalize to "paid" for the email template
            },
          });
          toast.success("Payment verification email sent automatically");

          // AUTOMATION: If payment is paid, automatically move order to 'payment_confirmed' status
          if (["order_placed", "order_confirmed", "pending_payment", "delivered"].includes(orderToNotify.status)) {
            await orderService.updateOrderStatus(orderId, "payment_confirmed");
            toast.info("Order status automatically moved to 'Payment Confirmed'");
          }
        } catch (emailErr) {
          console.error("Failed to send payment email:", emailErr);
        }
      }

      fetchOrders();
      toast.success(`Payment status updated to ${paymentStatus}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update payment status");
    }
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
      if (selectedOrder?.id === orderToDelete.id) {
        setSelectedOrder(null);
        setIsTimelineOpen(false);
      }
      setOrderToDelete(null);
      fetchOrders();
    } finally {
      setIsDeleting(false);
    }
  };
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = [
      "Order Number",
      "Customer Name",
      "Email",
      "Phone",
      "Date",
      "Total Amount",
      "Status",
      "Payment Status",
      "Shipping Address",
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return "";
      const s = String(val).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const rows = orders.map((o) => [
      escapeCSV(o.order_number),
      escapeCSV(`${o.customer_first_name} ${o.customer_last_name}`),
      escapeCSV(o.customer_email),
      escapeCSV(o.customer_phone),
      escapeCSV(new Date(o.created_at).toLocaleDateString()),
      escapeCSV(o.total_amount),
      escapeCSV(o.status),
      escapeCSV(o.payment_status),
      escapeCSV(
        `${o.shipping_street_address}, ${o.shipping_city}, ${o.shipping_postal_code}, ${o.shipping_country}`,
      ),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `little_luxuries_orders_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported successfully");
  };

  const handleExportPDF = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Little Luxuries — Orders Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

    const body = orders.map((o) => [
      o.order_number,
      `${o.customer_first_name} ${o.customer_last_name}`,
      new Date(o.created_at).toLocaleDateString(),
      formatPkr(Number(o.total_amount)),
      o.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Order #", "Customer", "Date", "Amount", "Status"]],
      body: body,
      headStyles: { fillColor: [139, 92, 246] }, // primary color
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9 },
    });

    doc.save(`little_luxuries_orders_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF Report generated");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Orders & Shipping</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Manage your boutique's fulfillment journey and customer transactions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button onClick={() => setIsAddModalOpen(true)} className="rounded-full h-11">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </div>
      </div>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            label: "Total Orders", 
            value: stats.total_orders.toLocaleString(), 
            note: dateFilter === "All Time" ? "Lifetime volume" : `In ${dateFilter.toLowerCase()}`, 
            noteColor: "text-muted-foreground",
          },
          { 
            label: "Pending Fulfillment", 
            value: stats.pending_fulfillment.toString(), 
            note:
              stats.pending_fulfillment === 0
                ? "✅ All caught up"
                : `⏱ ${stats.pending_fulfillment} require action`,
            noteColor:
              stats.pending_fulfillment === 0
                ? "text-emerald-600"
                : "text-(--color-gold-foreground)",
          },
          {
            label: "Avg. Monthly Earning",
            value: formatPkr(stats.avg_monthly_earning),
            note: "📈 Trending +12% from last month",
            noteColor: "text-emerald-600",
          },
          { 
            label: "Revenue (MTD)", 
            value: formatPkr(stats.revenue_mtd),
            note: `🎯 ${Math.min(100, Math.round((stats.revenue_mtd / REVENUE_TARGET_PKR) * 100))}% of ${formatPkr(REVENUE_TARGET_PKR)} target · collected when marked paid`,
            noteColor: "text-emerald-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-card p-6 shadow-(--shadow-card) border border-border/40"
          >
            <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-3 text-3xl font-serif text-foreground">{s.value}</div>
            <div className={`mt-3 text-xs ${s.noteColor}`}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Status Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-5">
        {[
          { label: "Order Placed", value: stats.order_placed, color: "text-blue-600" },
          { label: "Order Confirmed", value: stats.order_confirmed, color: "text-emerald-600" },
          { label: "Packed", value: stats.packed, color: "text-indigo-600" },
          { label: "Shipped", value: stats.shipped, color: "text-primary" },
          { label: "Delivered", value: stats.delivered, color: "text-emerald-600" },
          { label: "Pending Payment", value: stats.pending_payment, color: "text-(--color-gold-foreground)" },
          { label: "Payment Confirmed", value: stats.payment_confirmed, color: "text-indigo-600" },
          { label: "Cancelled", value: stats.cancelled, color: "text-destructive" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-card p-4 sm:p-5 shadow-(--shadow-card) border border-border/40 hover:border-border transition-colors"
          >
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {s.label}
            </div>
            <div className={`mt-2 text-2xl sm:text-3xl font-serif ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card shadow-(--shadow-card) overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition shadow-sm">
                <Filter className="h-4 w-4" /> {tab === "All Orders" ? "All Orders" : formatStatusLabel(tab)} <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-(--shadow-card) p-2">
              <DropdownMenuLabel className="font-serif px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">Order Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tabs.map((t) => {
                const count =
                  t === "All Orders"
                    ? stats.total_orders
                    : t === "order_placed"
                      ? stats.order_placed
                      : t === "order_confirmed"
                        ? stats.order_confirmed
                        : t === "payment_confirmed"
                          ? stats.payment_confirmed
                          : t === "pending_payment"
                            ? stats.pending_payment
                            : t === "packed"
                              ? stats.packed
                              : t === "shipped"
                                ? stats.shipped
                                : t === "delivered"
                                  ? stats.delivered
                                  : t === "cancelled"
                                    ? stats.cancelled
                                    : 0;

                return (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => setTab(t)}
                    className={`cursor-pointer rounded-lg px-3 py-2.5 my-0.5 ${tab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center gap-3 flex-1">
                        {t === "All Orders" ? (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                        ) : (
                          <div className={`h-2 w-2 rounded-full ${getStatusDotColor(t)}`} />
                        )}
                        <span className="font-medium">
                          {t === "All Orders" ? "All Orders" : formatStatusLabel(t)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-red-500 px-1.5 text-[11px] font-semibold text-white tabular-nums shadow-sm">
                          {count}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-muted/40 hover:bg-muted text-sm transition">
                  <Calendar className="h-4 w-4" /> {dateFilter} <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-(--shadow-card)">
                <DropdownMenuLabel className="font-serif">Date Range</DropdownMenuLabel>
                {(["All Time", "Last 7 Days", "Last 30 Days", "This Year"] as const).map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() => setDateFilter(d)}
                    className={`cursor-pointer ${dateFilter === d ? "bg-primary/10 text-primary" : ""}`}
                  >
                    {d}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="h-10 w-10 grid place-items-center rounded-full bg-muted/40 hover:bg-muted disabled:opacity-50 transition"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`h-10 w-10 grid place-items-center rounded-full bg-muted/40 hover:bg-muted transition ${paymentFilter !== "All" ? "text-primary bg-primary/10" : ""}`}
                >
                  <Filter className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-(--shadow-card)">
                <DropdownMenuLabel className="font-serif">Payment Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setPaymentFilter("All")}
                  className={`cursor-pointer ${paymentFilter === "All" ? "bg-primary/10 text-primary" : ""}`}
                >
                  All Payments
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setPaymentFilter("completed")}
                  className={`cursor-pointer ${paymentFilter === "completed" ? "bg-primary/10 text-primary" : ""}`}
                >
                  Paid / Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentFilter("pending")}
                  className={`cursor-pointer ${paymentFilter === "pending" ? "bg-primary/10 text-primary" : ""}`}
                >
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentFilter("failed")}
                  className={`cursor-pointer ${paymentFilter === "failed" ? "bg-primary/10 text-primary" : ""}`}
                >
                  Failed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <HorizontalScrollArea
          className="px-1 sm:px-2"
          scrollClassName="-mx-1 px-1 sm:mx-0 sm:px-2"
          sliderLabel="Slide to browse orders"
        >
          <table className="w-full min-w-[1050px] text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-[0.15em] text-muted-foreground border-b border-border bg-muted/30">
                <th className="min-w-[120px] px-4 py-4 text-left font-medium align-middle">
                  Order ID
                </th>
                <th className="min-w-[200px] px-3 py-4 text-left font-medium align-middle">
                  Customer
                </th>
                <th className="w-28 px-3 py-4 text-left font-medium align-middle whitespace-nowrap">
                  Date
                </th>
                <th className="min-w-[180px] px-3 py-4 text-left font-medium align-middle">
                  Items
                </th>
                <th className="w-28 px-3 py-4 text-left font-medium align-middle whitespace-nowrap">
                  Total
                </th>
                <th className="w-28 px-3 py-4 text-left font-medium align-middle">Payment</th>
                <th className="min-w-[100px] px-3 py-4 text-left font-medium align-middle">
                  Tracking
                </th>
                <th className="w-32 px-3 py-4 text-left font-medium align-middle">Status</th>
                <th className="w-14 px-4 py-4 text-right font-medium align-middle">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={`skeleton-${i}`}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-4 align-middle">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <Skeleton className="h-10 w-36" />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-destructive">
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={fetchOrders}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    <p className="text-sm">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-4 align-middle font-medium text-primary whitespace-nowrap">
                      {o.order_number}
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                          {getInitials(o.customer_first_name, o.customer_last_name)}
                        </div>
                        <div className="min-w-0 max-w-[220px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate font-medium text-foreground">
                              {o.customer_first_name} {o.customer_last_name}
                            </span>
                            {o.customer_phone &&
                              !o.order_status_history?.some(
                                (h) => h.status === "whatsapp_sent",
                              ) && (
                                <button
                                  onClick={() => {
                                    setSelectedOrder(o);
                                    setIsCommunicationModalOpen(true);
                                  }}
                                  className="text-[#25D366] hover:scale-110 transition-transform p-0.5 hover:bg-[#25D366]/10 rounded-md cursor-pointer"
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
                          <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                            {o.customer_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-middle whitespace-nowrap text-muted-foreground">
                      {formatDate(o.created_at)}
                    </td>
                    <td
                      className="px-3 py-4 align-middle cursor-pointer transition-colors hover:bg-muted/30"
                      onClick={() => {
                        setSelectedOrder(o);
                        setIsItemsModalOpen(true);
                      }}
                    >
                      <div className="flex items-center min-w-0">
                        <div className="flex shrink-0 -space-x-3 overflow-hidden">
                          {o.order_items?.slice(0, 3).map((item: any, idx: number) => (
                            <div
                              key={`${o.id}-img-${idx}`}
                              className="inline-block h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-background"
                              title={item.product_name}
                            >
                              {item.product_image_url ? (
                                <img
                                  src={item.product_image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                  {item.product_name?.substring(0, 1)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="ml-3 min-w-0 flex flex-col">
                          <span className="truncate text-xs font-medium text-foreground max-w-[160px]">
                          {o.order_items?.[0]?.product_name || "Custom Request"}
                        </span>
                          {o.order_items && o.order_items.length > 1 ? (
                            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                              + {o.order_items.length - 1} more
                          </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-middle font-medium whitespace-nowrap">
                      {formatPkr(Number(o.total_amount))}
                    </td>
                    <td className="px-3 py-4 align-middle whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-tight",
                          getPaymentStatusStyle(o.payment_status),
                        )}
                      >
                        {o.payment_status?.toUpperCase() || "PENDING"}
                      </span>
                    </td>
                    <td className="px-3 py-4 align-middle text-xs font-mono text-muted-foreground">
                      <span className="line-clamp-1 max-w-[120px]" title={o.tracking_number || undefined}>
                      {o.tracking_number || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-4 align-middle whitespace-nowrap">
                      <OrderStatus status={o.status} />
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(o);
                              setIsTimelineOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            View Timeline
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(o.id, "order_confirmed")}
                            className="cursor-pointer"
                            disabled={
                              [
                                "order_confirmed",
                                "payment_confirmed",
                                "packed",
                                "shipped",
                                "delivered",
                                "cancelled",
                                "refunded",
                              ].includes(o.status) ||
                              o.payment_status === "completed"
                            }
                          >
                            Mark order as confirmed
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
                          {o.status === "payment_confirmed" && o.payment_status !== "completed" && (
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
        </HorizontalScrollArea>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {orders.length > 0 ? `Showing 1 to ${orders.length} orders` : "No orders"}
          </div>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
              ‹
            </button>
            <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm">
              1
            </button>
            <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Eco banner */}
      <div className="rounded-2xl bg-card p-8 shadow-(--shadow-card) relative overflow-hidden">
        <h3 className="font-serif text-2xl text-foreground">Eco-Friendly Shipping Initiative</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Transitioning to 100% biodegradable packaging by year-end. Track your sustainability
          impact on the analytics dashboard.
        </p>
        <Button variant="outline" className="rounded-full mt-5">
          Learn More
        </Button>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 text-7xl">🌿</div>
      </div>

      <AddOrderModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onOrderAdded={fetchOrders}
      />

      <OrderTimelineModal
        isOpen={isTimelineOpen}
        onOpenChange={setIsTimelineOpen}
        order={selectedOrder}
      />

      <CommunicationLevelModal
        isOpen={isCommunicationModalOpen}
        onOpenChange={setIsCommunicationModalOpen}
        orderNumber={selectedOrder?.order_number || ""}
        status={formatStatusLabel(selectedOrder?.status || "")}
        customerName={`${selectedOrder?.customer_first_name || ""} ${selectedOrder?.customer_last_name || ""}`}
        customerPhone={selectedOrder?.customer_phone}
        customerTier={selectedOrder?.customer_tier as any}
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
            {selectedOrder?.order_items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0 ring-1 ring-border group-hover:ring-primary/30 transition-all">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
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
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
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
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-muted"
      }`}
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

function getPaymentStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    initiated: "bg-blue-100 text-blue-700",
    processing: "bg-gold/25 text-(--color-gold-foreground)",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700",
  };
  return styles[status] || styles.pending;
}

function getStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    order_placed: "bg-blue-500",
    order_confirmed: "bg-emerald-500",
    payment_confirmed: "bg-indigo-500",
    pending_payment: "bg-amber-500",
    packed: "bg-indigo-500",
    shipped: "bg-primary",
    delivered: "bg-emerald-500",
    cancelled: "bg-red-500",
  };
  return colors[status] || "bg-muted-foreground";
}
