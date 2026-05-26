import { createFileRoute } from "@tanstack/react-router";
import { Database } from "@/lib/supabase";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
// Test comment to verify git push
import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Pencil,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  Share2,
  Sparkles,
  Rocket,
  Archive,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminProducts, invalidateProductQueries } from "@/lib/product-queries";
import { productService } from "@/lib/supabase-service";
import { useQueryClient } from "@tanstack/react-query";
import { AddProductModal } from "@/components/add-product-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { ViewProductModal } from "@/components/view-product-modal";
import { EditProductModal } from "@/components/edit-product-modal";
import { ShareProductModal } from "@/components/share-product-modal";
import { SocialPostModal } from "@/components/social-post-modal";
import { PublishProductModal } from "@/components/publish-product-modal";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ExportMenu } from "@/components/export-menu";
import { cn } from "@/lib/utils";
import { formatPkr } from "@/lib/format-currency";
import logo from "@/assets/logo.png";
import { useState, useEffect } from "react";
import React from "react";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products — Little Luxuries Admin" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [search, setSearch] = useState("");
  return (
    <AdminLayout
      searchPlaceholder="Search product library…"
      searchValue={search}
      onSearch={setSearch}
    >
      <ProductsContent search={search} />
    </AdminLayout>
  );
}

function ProductsContent({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading: loading, refetch: refetchProducts } = useAdminProducts();
  const [filteredProducts, setFilteredProducts] = useState<
    Database["public"]["Tables"]["products"]["Row"][]
  >([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<
    Database["public"]["Tables"]["products"]["Row"] | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [genderFilter, setGenderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const applyFilters = React.useCallback(() => {
    let filtered = [...products];

    // Apply category filter
    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Apply gender filter
    if (genderFilter !== "All") {
      filtered = filtered.filter((p) => p.gender?.toLowerCase() === genderFilter.toLowerCase());
    }

    // Apply status filter
    if (statusFilter !== "All Status") {
      if (statusFilter === "Limited Edition") {
        filtered = filtered.filter(
          (p) => p.badge === "Limited Edition" || p.badge === "Limited edition",
        );
      } else if (statusFilter === "Bestseller") {
        filtered = filtered.filter((p) => p.badge === "Bestseller" || p.badge === "Best Seller");
      } else if (statusFilter === "Low stock") {
        filtered = filtered.filter(
          (p) => (p.units !== undefined && p.units > 0 && p.units < 5) || p.badge === "Low stock",
        );
      } else if (statusFilter === "In Stock") {
        filtered = filtered.filter(
          (p) => (p.units === undefined || p.units > 0) && p.badge !== "Out of Stock",
        );
      } else if (statusFilter === "Out of Stock") {
        filtered = filtered.filter(
          (p) => (p.units !== undefined && p.units <= 0) || p.badge === "Out of Stock",
        );
      }
    }

    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)),
      );
    }

    setFilteredProducts(filtered);
  }, [products, categoryFilter, genderFilter, statusFilter, search]);

  const refreshProducts = React.useCallback(async () => {
    await invalidateProductQueries(queryClient);
    await refetchProducts();
  }, [queryClient, refetchProducts]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleProductUpdated = React.useCallback(() => {
    void refreshProducts();
    setIsEditModalOpen(false);
    setSelectedProduct(null);
  }, [refreshProducts]);

  const handleProductAdded = React.useCallback(() => {
    void refreshProducts();
    setIsAddModalOpen(false);
  }, [refreshProducts]);

  const handleViewProduct = (p: Database["public"]["Tables"]["products"]["Row"]) => {
    setSelectedProduct(p);
    setIsViewModalOpen(true);
  };

  const handleEditProduct = (p: Database["public"]["Tables"]["products"]["Row"]) => {
    setSelectedProduct(p);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (p: Database["public"]["Tables"]["products"]["Row"]) => {
    setSelectedProduct(p);
    setIsDeleteModalOpen(true);
  };

  const handleShareProduct = (p: Database["public"]["Tables"]["products"]["Row"]) => {
    setSelectedProduct(p);
    setIsShareModalOpen(true);
  };

  const handleCreateSocialPost = (p: Database["public"]["Tables"]["products"]["Row"]) => {
    setSelectedProduct(p);
    setIsSocialModalOpen(true);
  };

  const handlePublishProduct = (p: Database["public"]["Tables"]["products"]["Row"]) => {
    setSelectedProduct(p);
    setIsPublishModalOpen(true);
  };

  const handleUnpublishProduct = async (
    product: Database["public"]["Tables"]["products"]["Row"],
  ) => {
    try {
      await productService.updateProduct(product.id, { status: "draft" });
      toast.success(`"${product.name}" has been unpublished and moved to drafts.`);
      refreshProducts();
    } catch (error) {
      toast.error("Failed to unpublish product.");
    }
  };

  const handleBulkPublish = async () => {
    if (selectedItems.length === 0) return;
    try {
      await Promise.all(
        selectedItems.map((id) => productService.updateProduct(id, { status: "published" })),
      );
      toast.success(`${selectedItems.length} products published.`);
      setSelectedItems([]);
      refreshProducts();
    } catch (e) {
      toast.error("Failed to publish products");
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedItems.length === 0) return;
    try {
      await Promise.all(
        selectedItems.map((id) => productService.updateProduct(id, { status: "draft" })),
      );
      toast.success(`${selectedItems.length} products unpublished.`);
      setSelectedItems([]);
      refreshProducts();
    } catch (e) {
      toast.error("Failed to unpublish products");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(selectedProduct.id);
      toast.success(`"${selectedProduct.name}" has been removed from your boutique.`);
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      refreshProducts();
    } catch (error) {
      toast.error("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products to export");
      return;
    }

    const headers = [
      "Product Name",
      "Category",
      "Price (PKR)",
      "Stock Status",
      "Status",
      "Badge",
      "Gender",
      "Available Units",
      "Sizes",
      "Description",
    ];

    const escapeCSV = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return "";
      const s = String(val).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const csvData = filteredProducts.map((p: Database["public"]["Tables"]["products"]["Row"]) => [
      escapeCSV(p.name),
      escapeCSV(p.category),
      escapeCSV(p.price),
      escapeCSV(
        p.badge === "Out of Stock" || (p.units !== undefined && p.units <= 0)
          ? "Out of Stock"
          : p.units !== undefined && p.units < 5
            ? `Low Stock (${p.units})`
            : `In Stock (${p.units || 0})`,
      ),
      escapeCSV(p.status),
      escapeCSV(p.badge),
      escapeCSV(p.gender),
      escapeCSV(p.units || 0),
      escapeCSV(p.sizes?.join(", ") || ""),
      escapeCSV(p.description),
    ]);

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `little_luxuries_products_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Products exported successfully");
  };

  const handleExportPDF = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Little Luxuries — Product Catalog", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

    const body = products.map((p) => [
      p.name,
      p.category,
      p.gender || "Unisex",
      p.units || 0,
      formatPkr(Number(p.price)),
      p.status.toUpperCase(),
      p.badge || "IN STOCK",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Product Name", "Category", "Gender", "Units", "Price", "Status", "Availability"]],
      body: body,
      headStyles: { fillColor: [139, 92, 246] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 9 },
    });

    doc.save(`little_luxuries_products_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Product Catalog PDF generated");
  };

  const lowStock = products.filter(
    (p: Database["public"]["Tables"]["products"]["Row"]) => p.badge === "Low stock",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Inventory Management</h1>
          <p className="mt-2 text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {products.length.toLocaleString()} Products
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blush" />
              {lowStock} Low Stock
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button className="rounded-full h-11 px-6" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-card p-4 shadow-(--shadow-card) flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-11 px-6 rounded-full bg-muted/60 hover:bg-muted border-0 text-sm font-medium transition flex items-center gap-2">
              <span className="text-muted-foreground font-normal text-[10px] uppercase tracking-wider">
                Category:
              </span>{" "}
              {categoryFilter} <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-(--shadow-card)">
            {["All Categories", "Onesies", "Sleepwear", "Knitwear", "Accessories", "Gift Sets"].map(
              (opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => setCategoryFilter(opt)}
                  className="rounded-lg py-2.5 font-medium focus:bg-primary-soft focus:text-primary cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{opt}</span>
                    {categoryFilter === opt && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-11 px-6 rounded-full bg-muted/60 hover:bg-muted border-0 text-sm font-medium transition flex items-center gap-2">
              <span className="text-muted-foreground font-normal text-[10px] uppercase tracking-wider">
                Gender:
              </span>{" "}
              {genderFilter} <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-(--shadow-card)">
            {["All", "Unisex", "Boy", "Girl"].map((opt) => (
              <DropdownMenuItem
                key={opt}
                onClick={() => setGenderFilter(opt)}
                className="cursor-pointer"
              >
                {opt}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-11 px-6 rounded-full bg-muted/60 hover:bg-muted border-0 text-sm font-medium transition flex items-center gap-2">
              <span className="text-muted-foreground font-normal text-[10px] uppercase tracking-wider">
                Status:
              </span>{" "}
              {statusFilter} <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-(--shadow-card)">
            {[
              "All Status",
              "In Stock",
              "Out of Stock",
              "New",
              "Limited Edition",
              "Bestseller",
              "Low stock",
            ].map((opt) => (
              <DropdownMenuItem
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className="cursor-pointer"
              >
                {opt}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={selectedItems.length === 0}
              className="h-11 px-5 rounded-full bg-muted/60 hover:bg-muted border-0 text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bulk Actions {selectedItems.length > 0 && `(${selectedItems.length})`}{" "}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-(--shadow-card)">
            <DropdownMenuItem
              onClick={handleBulkPublish}
              className="cursor-pointer font-medium text-primary"
            >
              <Rocket className="h-4 w-4 mr-2" /> Publish Selected
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleBulkUnpublish}
              className="cursor-pointer font-medium text-amber-600"
            >
              <Archive className="h-4 w-4 mr-2" /> Unpublish Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
              <Download className="h-4 w-4 mr-2" /> Export Selected (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" /> Export Selected (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.error("Delete functionality coming soon")}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button className="h-11 w-11 grid place-items-center rounded-full bg-muted hover:bg-muted/70 transition-colors">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card shadow-(--shadow-card) overflow-hidden">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.15em] text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left w-10">
                  <input
                    type="checkbox"
                    className="rounded border-border/40 text-primary focus:ring-primary/20 cursor-pointer"
                    checked={
                      selectedItems.length === filteredProducts.length &&
                      filteredProducts.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredProducts.map((p) => p.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="px-2 py-4 text-left font-medium">Product</th>
                <th className="px-4 py-4 text-left font-medium">Category</th>
                <th className="px-4 py-4 text-left font-medium">Gender</th>
                <th className="px-4 py-4 text-left font-medium">Size Range</th>
                <th className="px-4 py-4 text-left font-medium">Price</th>
                <th className="px-4 py-4 text-left font-medium">Availability</th>
                <th className="px-4 py-4 text-left font-medium">Status</th>
                <th className="px-4 py-4 text-left font-medium">Badges</th>
                <th className="px-6 py-4 text-right font-medium w-16">Actions</th>
              </tr>
            </thead>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} className="border-b border-border/40">
                  <td className="px-6 py-5">
                    <Skeleton className="h-4 w-4" />
                  </td>
                  <td className="px-2 py-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-5">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-5">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-4 py-5">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className="px-4 py-5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No products found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your filters to see more results.
                      </p>
                      <Button
                        className="rounded-full"
                        onClick={() => {
                          setCategoryFilter("All Categories");
                          setGenderFilter("All");
                          setStatusFilter("All Status");
                        }}
                      >
                        <Filter className="h-4 w-4 mr-2" /> Clear Filters
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p: Database["public"]["Tables"]["products"]["Row"]) => (
                <tr
                  key={p.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => handleViewProduct(p)}
                >
                  <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-border/40 text-primary focus:ring-primary/20 cursor-pointer"
                      checked={selectedItems.includes(p.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, p.id]);
                        } else {
                          setSelectedItems(selectedItems.filter((id) => id !== p.id));
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-2 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary-soft grid place-items-center">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-7 w-7 object-contain rounded"
                          />
                        ) : (
                          <img src={logo} alt="" className="h-7 w-7 object-contain" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.variant}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-soft/30 text-primary">
                      {p.gender || "Unisex"}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-muted-foreground">
                    {p.sizes?.join(", ") || "N/A"}
                  </td>
                  <td className="px-4 py-5 font-medium text-foreground">
                    {formatPkr(Number(p.price))}
                  </td>
                  <td className="px-4 py-5">
                    {p.badge === "Out of Stock" || (p.units !== undefined && p.units <= 0) ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          In Stock
                        </span>
                        <div className="text-[10px] text-muted-foreground font-medium pl-1">
                          {p.units ?? 0} units available
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                        p.status === "published"
                          ? "bg-emerald-50 text-emerald-600"
                          : p.status === "scheduled"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {p.status || "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    {p.badge && p.badge !== "Out of Stock" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary">
                        {p.badge}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right w-16" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleViewProduct(p)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleEditProduct(p)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleShareProduct(p)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleCreateSocialPost(p)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Social Post
                        </DropdownMenuItem>
                        {p.status === "published" || p.status === "scheduled" ? (
                          <DropdownMenuItem
                            className="cursor-pointer font-bold text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                            onClick={() => handleUnpublishProduct(p)}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Unpublish Product
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="cursor-pointer font-bold text-primary"
                            onClick={() => handlePublishProduct(p)}
                          >
                            <Rocket className="h-4 w-4 mr-2" />
                            Publish Product
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => handleDeleteProduct(p)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">1–{filteredProducts.length}</span>{" "}
            of <span className="font-medium text-foreground">{filteredProducts.length}</span>{" "}
            products
          </div>
          <Pagination totalProducts={filteredProducts.length} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground py-2">
        <span>✦ Premium Inventory Control</span>
        <span>✦ Secure Cloud Storage</span>
        <span>✦ Last updated 2 mins ago</span>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onProductAdded={handleProductAdded}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        productName={selectedProduct?.name || ""}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* View Product Modal */}
      {selectedProduct && (
        <ViewProductModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          product={selectedProduct}
          onEdit={() => handleEditProduct(selectedProduct)}
        />
      )}

      {/* Edit Product Modal */}
      {selectedProduct && (
        <EditProductModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          product={selectedProduct}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {/* Publish Product Modal */}
      {selectedProduct && (
        <PublishProductModal
          open={isPublishModalOpen}
          onOpenChange={setIsPublishModalOpen}
          product={selectedProduct}
          onPublished={refreshProducts}
          onShowSocialPost={(p) => {
            setSelectedProduct(p);
            setIsSocialModalOpen(true);
          }}
        />
      )}

      {/* Share Product Modal */}
      {selectedProduct && (
        <ShareProductModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          product={selectedProduct}
        />
      )}

      {/* Social Post Modal */}
      {selectedProduct && (
        <SocialPostModal
          open={isSocialModalOpen}
          onOpenChange={setIsSocialModalOpen}
          product={selectedProduct}
        />
      )}
    </div>
  );
}

function Pagination({ totalProducts }: { totalProducts: number }) {
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  // Don't show pagination if there's only one page
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page, last page with ellipsis
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-1">
      <button
        className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        ‹
      </button>

      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === "..." ? (
            <span className="px-2 text-muted-foreground">…</span>
          ) : (
            <button
              className={`h-9 w-9 rounded-full text-sm ${
                page === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              onClick={() => setCurrentPage(page as number)}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    </div>
  );
}
