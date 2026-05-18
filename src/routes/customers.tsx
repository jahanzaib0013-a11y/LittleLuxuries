import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Download,
  UserPlus,
  ChevronDown,
  Star,
  MoreHorizontal,
  Eye,
  Mail,
  ShieldAlert,
  Trash2,
  Phone,
  MessageCircle,
  Crown,
  Trophy,
  Award,
  Target,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ExportMenu } from "@/components/export-menu";
import { getCustomers, getCustomerStats, deleteCustomer, Customer } from "@/lib/customers";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewCustomerModal } from "@/components/view-customer-modal";
import { SendMessageModal } from "@/components/send-message-modal";
import { CustomerDeleteConfirmationModal } from "@/components/customer-delete-confirmation-modal";
import { AddCustomerModal } from "@/components/add-customer-modal";
import { formatPkr } from "@/lib/format-currency";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Little Luxuries Admin" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const [search, setSearch] = useState("");
  return (
    <AdminLayout searchPlaceholder="Search customers…" searchValue={search} onSearch={setSearch}>
      <CustomersContent search={search} />
    </AdminLayout>
  );
}

function CustomersContent({ search }: { search: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [tierFilter, setTierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: customersData,
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["customers", currentPage, search, tierFilter],
    queryFn: () => getCustomers(currentPage, 10, { search, tier: tierFilter }),
  });

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: getCustomerStats,
  });

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    setIsDeleting(true);
    try {
      const { success, error } = await deleteCustomer(selectedCustomer.id);
      if (success) {
        toast.success(`Client ${selectedCustomer.customer_name} deleted successfully.`);
        refetchCustomers();
        refetchStats();
        setIsDeleteModalOpen(false);
      } else {
        toast.error(error || "Failed to delete customer");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while deleting the customer");
    } finally {
      setIsDeleting(false);
    }
  };

  if (customersLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-11 w-36 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  if (customersError) {
    return (
      <div className="p-6 text-red-600">Error loading customer data: {customersError.message}</div>
    );
  }

  const customers = customersData?.customers || [];
  const totalPages = customersData?.totalPages || 1;
  const total = customersData?.total || 0;

  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast.error("No customers to export");
      return;
    }

    const headers = [
      "Customer Name",
      "Email",
      "Phone",
      "Total Orders",
      "Total Spent",
      "Membership Tier",
      "Join Date",
    ];

    const escapeCSV = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return "";
      const s = String(val).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const rows = customers.map((c) => [
      escapeCSV(c.customer_name),
      escapeCSV(c.email),
      escapeCSV(c.phone || "N/A"),
      escapeCSV(c.total_orders),
      escapeCSV(c.total_spent),
      escapeCSV(c.membership_tier),
      escapeCSV(c.join_date),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `little_luxuries_customers_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Customers exported successfully");
  };

  const handleExportPDF = () => {
    if (customers.length === 0) {
      toast.error("No customers to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Little Luxuries — Customer Directory", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

    const body = customers.map((c) => [
      c.customer_name,
      c.email,
      c.total_orders,
      formatPkr(Number(c.total_spent)),
      c.membership_tier.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Customer Name", "Email", "Orders", "Spent", "Tier"]],
      body: body,
      headStyles: { fillColor: [139, 92, 246] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9 },
    });

    doc.save(`little_luxuries_customers_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Customer PDF Report generated");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Customers</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Managing {stats?.total_customers || 0} luxury client accounts and preferences.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button className="rounded-full h-11" onClick={() => setIsAddCustomerModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card) border border-border/40">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-xl bg-primary-soft grid place-items-center text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                New this month
              </span>
              <div className="mt-1 text-3xl font-serif text-foreground">
                {stats?.new_this_month || 0}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              +12%
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card) border border-border/40">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-xl bg-gold/25 grid place-items-center text-(--color-gold-foreground)">
              <Star className="h-5 w-5" />
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Avg. Lifetime Value
              </span>
              <div className="mt-1 text-3xl font-serif text-foreground">
                {stats?.avg_lifetime_value ?? formatPkr(0)}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              Stable
            </span>
          </div>
        </div>
      </div>

      {/* Membership Tiers Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Platinum",
            count: stats?.tier_counts?.Platinum || 0,
            icon: Crown,
            color: "text-slate-400",
            bg: "bg-slate-50",
            border: "border-slate-200",
          },
          {
            label: "Gold",
            count: stats?.tier_counts?.Gold || 0,
            icon: Trophy,
            color: "text-(--color-gold-foreground)",
            bg: "bg-gold/10",
            border: "border-gold/20",
          },
          {
            label: "Silver",
            count: stats?.tier_counts?.Silver || 0,
            icon: Award,
            color: "text-(--color-secondary-foreground)",
            bg: "bg-blush/20",
            border: "border-blush/30",
          },
          {
            label: "Bronze",
            count: stats?.tier_counts?.Bronze || 0,
            icon: Target,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-100",
          },
          {
            label: "Standard",
            count: stats?.tier_counts?.Standard || 0,
            icon: Users,
            color: "text-muted-foreground",
            bg: "bg-muted/30",
            border: "border-border/60",
          },
        ].map((tier) => (
          <div
            key={tier.label}
            className={`rounded-2xl ${tier.bg} ${tier.border} border p-4 shadow-sm hover:shadow-md transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <tier.icon className={`h-4 w-4 ${tier.color}`} />
              <span className="text-2xl font-serif text-foreground">{tier.count}</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
              {tier.label}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card shadow-(--shadow-card) overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors text-sm">
                  Tier: {tierFilter} <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-(--shadow-card)">
                {["All", "Standard", "Silver", "Gold", "Platinum"].map((tier) => (
                  <DropdownMenuItem
                    key={tier}
                    onClick={() => setTierFilter(tier)}
                    className="cursor-pointer"
                  >
                    {tier}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors text-sm">
                  Status: {statusFilter} <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-(--shadow-card)">
                {["All", "Active", "Inactive", "New"].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className="cursor-pointer"
                  >
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, total)} of {total}{" "}
            customers
          </div>
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
              {customers.map((c: Customer) => {
                const initials = c.customer_name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const color =
                  c.membership_tier === "Gold"
                    ? "gold"
                    : c.membership_tier === "Silver"
                      ? "blush"
                      : "lilac";

                return (
                  <tr
                    key={c.email}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`h-10 w-10 shrink-0 rounded-full grid place-items-center text-xs font-semibold ${
                              color === "blush"
                                ? "bg-blush/50 text-(--color-secondary)"
                                : color === "gold"
                                  ? "bg-gold/30 text-(--color-gold-foreground)"
                                  : "bg-primary-soft text-primary"
                            }`}
                          >
                            {initials}
                          </div>
                          <div
                            className={`absolute -top-1 -left-1 h-5 w-5 rounded-full z-10 shadow-lg flex items-center justify-center border-2 border-card ${
                              c.membership_tier === "Platinum"
                                ? "bg-linear-to-br from-slate-900 to-slate-700"
                                : c.membership_tier === "Gold"
                                  ? "bg-linear-to-br from-(--color-gold-foreground) to-amber-600"
                                  : c.membership_tier === "Silver"
                                    ? "bg-linear-to-br from-purple-700 to-fuchsia-600"
                                    : c.membership_tier === "Bronze"
                                      ? "bg-linear-to-br from-indigo-700 to-blue-600"
                                      : "bg-linear-to-br from-muted-foreground to-slate-500"
                            }`}
                          >
                            {c.membership_tier === "Platinum" && (
                              <Crown className="h-2.5 w-2.5 text-white" />
                            )}
                            {c.membership_tier === "Gold" && (
                              <Trophy className="h-2.5 w-2.5 text-white" />
                            )}
                            {c.membership_tier === "Silver" && (
                              <Award className="h-2.5 w-2.5 text-white" />
                            )}
                            {c.membership_tier === "Bronze" && (
                              <Target className="h-2.5 w-2.5 text-white" />
                            )}
                            {c.membership_tier === "Standard" && (
                              <Users className="h-2.5 w-2.5 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate max-w-[200px]">
                            {c.customer_name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {c.membership_tier === "Gold" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-bold bg-gold/20 text-(--color-gold-foreground) border border-gold/30">
                                Gold Member
                              </span>
                            ) : c.membership_tier === "Silver" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-bold bg-blush/30 text-(--color-secondary) border border-blush/40">
                                Silver Member
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-bold bg-muted text-muted-foreground border border-border">
                                {c.membership_tier}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-5">
                      {c.total_orders}{" "}
                      {c.pending_orders > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({c.pending_orders} pending)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-5 font-medium">{c.total_spent}</td>
                    <td className="px-4 py-5 text-muted-foreground">{c.join_date}</td>
                    <td className="px-4 py-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl shadow-(--shadow-card)"
                        >
                          <DropdownMenuLabel className="font-serif">
                            Customer Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsMessageModalOpen(true);
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" /> Send Message
                          </DropdownMenuItem>
                          {c.phone && (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => window.open(`tel:${c.phone}`, "_self")}
                              >
                                <Phone className="h-4 w-4 mr-2" /> Call Customer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  const phone = c.phone as string;
                                  const message = encodeURIComponent(
                                    `Hello ${c.customer_name}, this is from Little Luxuries regarding your account.`,
                                  );
                                  window.open(
                                    `https://api.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, "")}&text=${message}`,
                                    "_blank",
                                  );
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2 text-emerald-600" /> WhatsApp
                                Message
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => toast.error(`${c.email} has been blacklisted.`)}
                          >
                            <ShieldAlert className="h-4 w-4 mr-2" /> Blacklist Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <button
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ‹ Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`h-9 w-9 rounded-full text-sm ${
                      pageNum === currentPage
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2 text-muted-foreground">…</span>
                  <button
                    className={`h-9 w-9 rounded-full text-sm hover:bg-muted ${
                      currentPage === totalPages ? "bg-primary text-primary-foreground" : ""
                    }`}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          onClick={() => toast.info("Campaign draft created for 82 inactive customers.")}
          className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-5 text-left hover:bg-primary-soft/60 transition-colors"
        >
          <div className="text-sm font-semibold text-foreground">Churn Prevention</div>
          <div className="text-xs text-muted-foreground mt-1">
            82 customers haven't purchased in 60 days.{" "}
            <span className="text-primary underline">Send campaign?</span>
          </div>
        </button>
        <button
          onClick={() => toast.info("Review requests scheduled for delivery.")}
          className="rounded-2xl border border-gold/30 bg-gold/10 p-5 text-left hover:bg-gold/20 transition-colors"
        >
          <div className="text-sm font-semibold text-foreground">Review Requests</div>
          <div className="text-xs text-muted-foreground mt-1">
            12 new orders delivered yesterday are eligible for review follow-ups.
          </div>
        </button>
        <button
          onClick={() => {
            handleExportCSV(); // Or we can show a choice here too, but let's stick to CSV for "Quick Export" or maybe choice
          }}
          className="rounded-2xl border border-border bg-muted/30 p-5 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="text-sm font-semibold text-foreground">Quick Export</div>
          <div className="text-xs text-muted-foreground mt-1">
            Last export was generated on Jan 14, 2024 by elena.vance
          </div>
        </button>
      </div>

      <ViewCustomerModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        customer={selectedCustomer}
      />

      <SendMessageModal
        open={isMessageModalOpen}
        onOpenChange={setIsMessageModalOpen}
        customer={selectedCustomer}
      />

      <CustomerDeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        customerName={selectedCustomer?.customer_name || ""}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <AddCustomerModal open={isAddCustomerModalOpen} onOpenChange={setIsAddCustomerModalOpen} />
    </div>
  );
}
