import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Download, MoreHorizontal, CheckCircle2, Pencil } from "lucide-react";
import { inventoryProducts } from "@/lib/admin-data";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout searchPlaceholder="Search product library…">
      <ProductsContent />
    </AdminLayout>
  ),
});

function ProductsContent() {
  const lowStock = inventoryProducts.filter((p) => p.lowStock).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Inventory Management</h1>
          <p className="mt-2 text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />{inventoryProducts.length.toLocaleString()} Products</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[color:var(--color-blush)]" />{lowStock} Low Stock</span>
          </p>
        </div>
        <Button className="rounded-full h-11 px-6"><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] flex flex-wrap items-center gap-3">
        <FilterSelect label="Category" value="All Categories" />
        <FilterSelect label="Gender" value="Unisex" />
        <FilterSelect label="Status" value="All Status" />
        <div className="flex-1" />
        <FilterSelect label="" value="Bulk Actions" />
        <button className="h-11 w-11 grid place-items-center rounded-full bg-muted hover:bg-muted/70"><Filter className="h-4 w-4" /></button>
        <button className="h-11 w-11 grid place-items-center rounded-full bg-muted hover:bg-muted/70"><Download className="h-4 w-4" /></button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.15em] text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left w-10"><input type="checkbox" className="rounded" /></th>
                <th className="px-2 py-4 text-left font-medium">Product</th>
                <th className="px-4 py-4 text-left font-medium">Category</th>
                <th className="px-4 py-4 text-left font-medium">Size Range</th>
                <th className="px-4 py-4 text-left font-medium">Price</th>
                <th className="px-4 py-4 text-left font-medium">Stock</th>
                <th className="px-4 py-4 text-left font-medium">Status</th>
                <th className="px-4 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryProducts.map((p) => (
                <tr key={p.sku} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="px-6 py-5"><input type="checkbox" className="rounded" /></td>
                  <td className="px-2 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary-soft grid place-items-center">
                        <img src={logo} alt="" className="h-7 w-7 object-contain" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-5 text-muted-foreground">{p.size}</td>
                  <td className="px-4 py-5 font-medium text-foreground">{p.price}</td>
                  <td className="px-4 py-5">
                    {p.lowStock ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--color-blush)]/40 text-[color:var(--color-secondary)] text-xs font-medium">
                        {p.stock} • Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-foreground">
                        {p.stock} <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    {p.status === "Active" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--color-gold)]/25 text-[color:var(--color-gold-foreground)] text-xs font-medium">
                        <Pencil className="h-3 w-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-5 text-right">
                    <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">1–{inventoryProducts.length}</span> of <span className="font-medium text-foreground">1,284</span> products
          </div>
          <Pagination />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground py-2">
        <span>✦ Premium Inventory Control</span>
        <span>✦ Secure Cloud Storage</span>
        <span>✦ Last updated 2 mins ago</span>
      </div>
    </div>
  );
}

function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative">
      <select className="h-11 pl-4 pr-9 rounded-full bg-muted/60 border-0 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
        <option>{value}</option>
      </select>
      {label && <span className="absolute -top-2 left-4 text-[10px] tracking-wider uppercase text-muted-foreground bg-card px-1">{label}</span>}
    </div>
  );
}

function Pagination() {
  return (
    <div className="flex items-center gap-1">
      <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground">‹</button>
      <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm">1</button>
      <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">2</button>
      <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">3</button>
      <span className="px-2 text-muted-foreground">…</span>
      <button className="h-9 w-9 rounded-full hover:bg-muted text-sm">32</button>
      <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground">›</button>
    </div>
  );
}
