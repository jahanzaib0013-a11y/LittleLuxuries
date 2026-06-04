import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { Heart, Search, ArrowDownUp, X, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { products, collections, type Product } from "@/lib/products";
import { useFavorites } from "@/hooks/use-favorites";
import { productService } from "@/lib/supabase-service";
import { formatPkr } from "@/lib/format-currency";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type Database } from "@/lib/supabase";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Little Luxuries" },
      {
        name: "description",
        content:
          "Browse our curated collection of organic cotton, linen, and merino wool baby garments.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { category?: string } => {
    return {
      category: search.category as string | undefined,
    };
  },
  component: Shop,
});

function Shop() {
  const { category: initialCategory } = Route.useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "All");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">(
    "featured",
  );
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<string[]>([]);

  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart, openCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleAddToCart = (product: Product) => {
    const defaultSize = product.sizes?.[0] || "One Size";
    addToCart(product.id, defaultSize, 1);
    toast.success(`Added ${product.name} to cart`);
    openCart();
  };

  const toggleBadge = (badge: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge],
    );
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const fetchedProducts = await productService.getProducts("published");
      const productsWithImages = fetchedProducts.map((product: Product) => ({
        ...product,
        image: product.image_url || products[0]?.image,
        image_url: product.image_url,
      }));
      const finalProducts = productsWithImages.length > 0 ? productsWithImages : products;
      
      const uniqueBadges = Array.from(
        new Set(finalProducts.map((p) => p.badge).filter(Boolean) as string[]),
      );
      setBadges(uniqueBadges);
      setShopProducts(finalProducts);
    } catch {
      setShopProducts(products);
      const uniqueBadges = Array.from(
        new Set(products.map((p) => p.badge).filter(Boolean) as string[]),
      );
      setBadges(uniqueBadges);
    } finally {
      setLoading(false);
    }
  };

  const priceMin = useMemo(() => Math.min(...shopProducts.map((p) => p.price), 0), [shopProducts]);
  const priceMax = useMemo(() => Math.max(...shopProducts.map((p) => p.price), 0), [shopProducts]);

  const filtered = useMemo(() => {
    let result = shopProducts;

    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.variant.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedBadges.length > 0) {
      result = result.filter((p) => p.badge && selectedBadges.includes(p.badge));
    }

    if (priceRange.min !== null) {
      result = result.filter((p) => p.price >= priceRange.min!);
    }
    if (priceRange.max !== null) {
      result = result.filter((p) => p.price <= priceRange.max!);
    }

    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === "newest") result = [...result].sort((a, b) => (a.badge === "New" ? -1 : 0));

    return result;
  }, [shopProducts, searchQuery, selectedCategory, selectedBadges, sortBy, priceRange]);

  function ProductCardSkeleton() {
    return (
      <div className="flex flex-col">
        <div
          className="rounded-2xl overflow-hidden bg-muted animate-pulse"
          style={{ aspectRatio: "3/4" }}
        />
        <div className="mt-3 px-0.5 space-y-2">
          <div className="flex justify-between">
            <div className="h-3.5 w-28 rounded-full bg-muted animate-pulse" />
            <div className="h-3.5 w-14 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedBadges.length > 0 ||
    priceRange.min !== null ||
    priceRange.max !== null ||
    searchQuery !== "";

  return (
    <Layout>
      {/* HERO BANNER */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-eyebrow mb-4">The Collection</p>
            <h1 className="font-serif text-4xl leading-[1.08] tracking-tight text-foreground break-words sm:text-5xl md:text-6xl lg:text-[3.5rem]">
              Timeless elegance for your little one
            </h1>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, oklch(0.985 0.004 300))" }}
        />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[120px]" />
      </section>

      {/* ── PREMIUM FILTER TOOLBAR ────────────────────────────────── */}
      <div id="product-grid" className="sticky top-16 sm:top-20 z-30">
        <div
          style={{
            background: "oklch(1 0 0 / 0.96)",
            backdropFilter: "blur(28px) saturate(180%)",
            borderBottom: "1px solid oklch(0.93 0.010 300)",
            boxShadow: "0 1px 0 oklch(1 0 0), 0 12px 48px -10px oklch(0.40 0.12 295 / 0.12)",
          }}
        >
          {/* Accent bar */}
          <div
            style={{
              height: 2,
              background:
                "linear-gradient(90deg, transparent 0%, oklch(0.78 0.13 85) 30%, oklch(0.45 0.13 295) 65%, transparent 100%)",
            }}
          />
          <div className="mx-auto max-w-7xl px-6">
            {/* TOP ROW */}
            <div className="flex flex-col gap-3 py-3.5 border-b border-border/25 md:flex-row md:items-center md:gap-5">
              <div className="relative w-full md:flex-1 md:max-w-lg group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-[15px] pointer-events-none transition-all duration-200"
                  style={{ color: "oklch(0.70 0.020 290)" }}
                />
                <input
                  type="text"
                  placeholder="Search styles, fabrics, collections…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 text-[13px] outline-none transition-all duration-250 rounded-2xl"
                  style={{
                    background: "oklch(0.975 0.005 300)",
                    border: "1px solid oklch(0.91 0.012 300)",
                    color: "var(--foreground)",
                    letterSpacing: "0.01em",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.55 0.10 295)";
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.boxShadow = "0 0 0 4px oklch(0.45 0.13 295/0.09)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.91 0.012 300)";
                    e.currentTarget.style.background = "oklch(0.975 0.005 300)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {searchQuery && (
          <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 grid size-5 place-items-center rounded-full transition-colors"
                    style={{ background: "oklch(0.91 0.012 300)" }}
                  >
                    <X className="size-3" style={{ color: "oklch(0.50 0.025 290)" }} />
          </button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 md:ml-auto md:justify-end">
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal
                    className="size-3.5"
                    style={{ color: "oklch(0.68 0.020 290)" }}
                  />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "featured" | "price-asc" | "price-desc" | "newest",
                      )
                    }
                    className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest outline-none cursor-pointer rounded-2xl transition-all"
                    style={{
                      background: "oklch(0.975 0.005 300)",
                      border: "1px solid oklch(0.91 0.012 300)",
                      color: "oklch(0.30 0.04 285)",
                    }}
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">New Arrivals</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                  </select>
                </div>
                <div className="flex items-baseline gap-1.5 md:pl-4 md:border-l md:border-border/30">
                  <span
                    className="font-serif text-3xl font-light leading-none tracking-tight"
                    style={{ color: "oklch(0.22 0.03 285)" }}
                  >
                    {filtered.length}
                  </span>
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.20em] pb-0.5"
                    style={{ color: "oklch(0.60 0.025 290)" }}
                  >
                    {filtered.length === 1 ? "piece" : "pieces"}
                  </span>
                </div>
              </div>
            </div>

            {/* FILTER ROW — 3 labeled sections */}
            <div className="flex items-center gap-0 py-2.5 flex-wrap">
              {/* CATEGORY */}
              <div
                className="flex items-center gap-2.5 pr-5 mr-5"
                style={{ borderRight: "1px solid oklch(0.91 0.010 300)" }}
              >
                <span
                  className="font-serif italic text-[12px] shrink-0"
                  style={{ color: "oklch(0.60 0.03 290)" }}
                >
                  Category
                </span>
                {(["All", ...collections.map((c) => c.name)] as string[]).map((cat) => {
                  const on = cat === "All" ? selectedCategory === "All" : selectedCategory === cat;
                  return (
            <button
              key={cat}
                      onClick={() => setSelectedCategory(on && cat !== "All" ? "All" : cat)}
                      className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200"
                      style={
                        on
                          ? {
                              background: "oklch(0.18 0.025 285)",
                              color: "#fff",
                              border: "1px solid oklch(0.18 0.025 285)",
                              boxShadow:
                                "0 2px 10px oklch(0.18 0.025 285/0.25), inset 0 1px 0 oklch(1 0 0/0.08)",
                              letterSpacing: "0.06em",
                            }
                          : {
                              background: "transparent",
                              color: "oklch(0.52 0.025 290)",
                              border: "1px solid oklch(0.89 0.012 300)",
                              letterSpacing: "0.06em",
                            }
                      }
            >
              {cat}
                    </button>
                  );
                })}
              </div>

              {/* STATUS */}
              <div
                className="flex items-center gap-2.5 pr-5 mr-5"
                style={{ borderRight: "1px solid oklch(0.91 0.010 300)" }}
              >
                <span
                  className="font-serif italic text-[12px] shrink-0"
                  style={{ color: "oklch(0.60 0.03 290)" }}
                >
                  Status
                </span>
                {badges.map((badge) => {
                  const on = selectedBadges.includes(badge);
                  const ct = shopProducts.filter((p) => p.badge === badge).length;
                  return (
                    <button
                      key={badge}
                      onClick={() => toggleBadge(badge)}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200"
                      style={
                        on
                          ? {
                              background: "oklch(0.18 0.025 285)",
                              color: "#fff",
                              border: "1px solid oklch(0.18 0.025 285)",
                              boxShadow:
                                "0 2px 10px oklch(0.18 0.025 285/0.25), inset 0 1px 0 oklch(1 0 0/0.08)",
                              letterSpacing: "0.06em",
                            }
                          : {
                              background: "transparent",
                              color: "oklch(0.52 0.025 290)",
                              border: "1px solid oklch(0.89 0.012 300)",
                              letterSpacing: "0.06em",
                            }
                      }
                    >
                      {badge}
                      <span
                        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black tracking-tight transition-all"
                        style={{
                          background: on ? "oklch(1 0 0/0.18)" : "oklch(0.93 0.010 300)",
                          color: on ? "#fff" : "oklch(0.50 0.025 290)",
                        }}
                      >
                        {ct}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* BUDGET */}
              <div className="flex items-center gap-2.5">
                <span
                  className="font-serif italic text-[12px] shrink-0"
                  style={{ color: "oklch(0.60 0.03 290)" }}
                >
                  Budget
                </span>
                {(
                  [
                    { label: "Under 2K", min: null, max: 2000 },
                    { label: "2K – 5K", min: 2000, max: 5000 },
                    { label: "5K+", min: 5000, max: null },
                  ] as { label: string; min: number | null; max: number | null }[]
                ).map((q) => {
                  const on = priceRange.min === q.min && priceRange.max === q.max;
                  return (
                    <button
                      key={q.label}
                      onClick={() =>
                        setPriceRange(on ? { min: null, max: null } : { min: q.min, max: q.max })
                      }
                      className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200"
                      style={
                        on
                          ? {
                              background:
                                "linear-gradient(135deg, oklch(0.80 0.14 85) 0%, oklch(0.70 0.12 72) 100%)",
                              color: "oklch(0.22 0.05 75)",
                              border: "1px solid oklch(0.68 0.12 74)",
                              boxShadow:
                                "0 2px 12px oklch(0.75 0.13 83/0.35), inset 0 1px 0 oklch(1 0 0/0.30)",
                              letterSpacing: "0.06em",
                            }
                          : {
                              background: "transparent",
                              color: "oklch(0.52 0.025 290)",
                              border: "1px solid oklch(0.89 0.012 300)",
                              letterSpacing: "0.06em",
                            }
                      }
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedBadges([]);
                    setPriceRange({ min: null, max: null });
                    setSearchQuery("");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
                  style={{
                    color: "oklch(0.58 0.025 290)",
                    border: "1px solid oklch(0.89 0.012 300)",
                  }}
                >
                  <X className="size-3" /> Reset all
                </button>
              )}
            </div>

            {/* ACTIVE CHIPS */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap pb-2.5">
                <span
                  className="text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ color: "oklch(0.72 0.025 290)" }}
                >
                  Filtering:
                </span>
                {selectedCategory !== "All" && (
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.94 0.04 300), oklch(0.91 0.05 290))",
                      border: "1px solid oklch(0.80 0.08 295)",
                      color: "var(--primary)",
                    }}
                  >
                    {selectedCategory} <X className="size-2.5 opacity-50" />
                  </button>
                )}
                {selectedBadges.map((b) => (
                  <button
                    key={b}
                    onClick={() => toggleBadge(b)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.94 0.04 300), oklch(0.91 0.05 290))",
                      border: "1px solid oklch(0.80 0.08 295)",
                      color: "var(--primary)",
                    }}
                  >
                    {b} <X className="size-2.5 opacity-50" />
            </button>
          ))}
                {(priceRange.min !== null || priceRange.max !== null) && (
                  <button
                    onClick={() => setPriceRange({ min: null, max: null })}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.95 0.10 85), oklch(0.92 0.08 80))",
                      border: "1px solid oklch(0.80 0.12 85/0.6)",
                      color: "oklch(0.30 0.07 80)",
                    }}
                  >
                    PKR {priceRange.min?.toLocaleString() ?? "0"} –{" "}
                    {priceRange.max?.toLocaleString() ?? "∞"} <X className="size-2.5 opacity-50" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: "oklch(0.95 0.005 300)",
                      border: "1px solid oklch(0.89 0.015 300)",
                      color: "oklch(0.45 0.025 290)",
                    }}
                  >
                    "{searchQuery}" <X className="size-2.5 opacity-50" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <section className="mx-auto max-w-7xl px-6 pb-28 pt-8">
        {/* Section header */}
        <div
          className="flex items-center justify-between mb-8 pb-5"
          style={{ borderBottom: "1px solid oklch(0.91 0.012 300)" }}
        >
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-[0.22em]"
              style={{ color: "oklch(0.62 0.025 290)" }}
            >
              Our Products
            </p>
            <h2 className="font-serif text-xl mt-0.5" style={{ color: "oklch(0.22 0.03 285)" }}>
              {hasActiveFilters
                ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} found`
                : "Full Collection"}
            </h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedBadges([]);
                setPriceRange({ min: null, max: null });
                setSearchQuery("");
              }}
              className="text-[11px] font-bold uppercase tracking-widest transition-colors"
              style={{ color: "oklch(0.50 0.025 290)" }}
            >
              View All
            </button>
          )}
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="size-16 rounded-full mb-6 grid place-items-center"
              style={{ background: "oklch(0.93 0.03 300)" }}
            >
              <Search className="size-6" style={{ color: "oklch(0.55 0.06 295)" }} />
            </div>
            <p
              className="text-[10px] font-black uppercase tracking-[0.22em] mb-2"
              style={{ color: "oklch(0.65 0.025 290)" }}
            >
              No Results
            </p>
            <h3 className="font-serif text-2xl mb-2" style={{ color: "oklch(0.25 0.03 285)" }}>
              Nothing matched your filters
            </h3>
            <p
              className="text-sm max-w-xs leading-relaxed mb-8"
              style={{ color: "oklch(0.58 0.025 290)" }}
            >
              Try broadening your search or explore the full collection below.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedBadges([]);
                setPriceRange({ min: null, max: null });
                setSortBy("featured");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5"
              style={{
                background: "oklch(0.18 0.025 285)",
                color: "#fff",
                boxShadow: "0 4px 18px oklch(0.18 0.025 285/0.25)",
              }}
            >
              View Full Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => {
              const isOutOfStock =
                p.badge === "Out of Stock" || (p.units !== undefined && p.units <= 0);
              return (
                <article
                  key={p.id}
                  className={cn("group flex flex-col", isOutOfStock && "opacity-80")}
                >
                  {/* Image */}
                  {isOutOfStock ? (
                    <div
                      className="block relative overflow-hidden rounded-2xl cursor-not-allowed"
                      style={{ aspectRatio: "3/4" }}
                    >
                {p.badge && (
                        <span
                          className="absolute left-3 top-3 z-10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full"
                          style={{
                            background: "oklch(0.45 0.13 295)",
                            color: "#fff",
                            boxShadow: "0 2px 8px oklch(0 0 0/0.20)",
                          }}
                        >
                    {p.badge}
                  </span>
                )}

                      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-6 py-2 rounded-full border-2 border-white/80 text-white text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl">
                          Sold Out
                        </span>
                      </div>

                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                        width={800}
                        height={1067}
                        className="h-full w-full object-cover grayscale-[0.5]"
                      />
              </div>
                  ) : (
                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                      className="block relative overflow-hidden rounded-2xl"
                      style={{ aspectRatio: "3/4" }}
                  >
                      {p.badge && (
                        <span
                          className="absolute left-3 top-3 z-10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full"
                          style={{
                            background:
                              p.badge === "New"
                                ? "oklch(0.18 0.025 285)"
                                : p.badge === "Bestseller"
                                  ? "linear-gradient(135deg,oklch(0.80 0.14 85),oklch(0.70 0.12 72))"
                                  : "oklch(0.45 0.13 295)",
                            color: p.badge === "Bestseller" ? "oklch(0.20 0.05 75)" : "#fff",
                            boxShadow: "0 2px 8px oklch(0 0 0/0.20)",
                          }}
                        >
                          {p.badge}
                        </span>
                      )}

                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        width={800}
                        height={1067}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div
                        className="absolute inset-0 transition-opacity duration-400 opacity-0 group-hover:opacity-100"
                        style={{
                          background:
                            "linear-gradient(to top, oklch(0.12 0.02 285/0.55) 0%, transparent 55%)",
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-3 opacity-100 transition-all duration-300 sm:p-4 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(p);
                          }}
                          className="flex h-11 min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary shadow-xl transition-all hover:bg-primary hover:text-white"
                        >
                          <ShoppingBag className="size-3.5 shrink-0" aria-hidden />
                          <span className="truncate sm:hidden">Add</span>
                          <span className="truncate hidden sm:inline">Add to Cart</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(p.id);
                          }}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all"
                          style={{
                            background: isFavorite(p.id) ? "var(--primary)" : "oklch(1 0 0/0.20)",
                            color: isFavorite(p.id) ? "white" : "#fff",
                            backdropFilter: "blur(8px)",
                          }}
                          aria-label="Wishlist"
                        >
                          <Heart className={`size-4 ${isFavorite(p.id) ? "fill-white" : ""}`} />
                        </button>
                      </div>
                    </Link>
                  )}

                  {/* Info */}
                  <div className="mt-3 px-0.5">
                    <div className="flex items-start justify-between gap-2">
                      {isOutOfStock ? (
                        <h3 className="font-serif text-[15px] leading-snug text-foreground/60 cursor-not-allowed line-clamp-1">
                          {p.name}
                        </h3>
                      ) : (
                        <Link to="/product/$id" params={{ id: p.id }}>
                          <h3 className="font-serif text-[15px] leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-1">
                            {p.name}
                          </h3>
                        </Link>
                      )}
                      <span
                        className="font-serif text-[15px] font-semibold shrink-0"
                        style={{ color: "oklch(0.30 0.04 285)" }}
                      >
                        {formatPkr(Number(p.price))}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 text-[11px] font-medium truncate"
                      style={{ color: "oklch(0.62 0.022 290)" }}
                    >
                      {p.variant}
                    </p>
              </div>
            </article>
              );
            })}
        </div>
        )}
      </section>

      {/* CTA SECTION */}
      <section className="mx-auto max-w-7xl my-16 px-6">
        <div
          className="relative overflow-hidden rounded-[40px] px-8 py-20 text-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.95 0.03 320) 0%, oklch(0.93 0.04 300) 50%, oklch(0.94 0.04 290) 100%)",
          }}
        >
          {/* decorative blobs */}
          <div
            className="absolute -top-16 -right-16 size-64 rounded-full opacity-40"
            style={{ background: "oklch(0.78 0.13 85 / 0.3)", filter: "blur(60px)" }}
          />
          <div
            className="absolute -bottom-16 -left-16 size-64 rounded-full opacity-40"
            style={{ background: "oklch(0.45 0.13 295 / 0.2)", filter: "blur(60px)" }}
          />
          <div className="relative max-w-xl mx-auto">
            <span className="label-eyebrow">Exclusive Access</span>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl text-foreground leading-tight">
              Join the Little Luxuries Circle
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "oklch(0.50 0.025 290)" }}
            >
              Early access to new collections, member-only offers, and gentle parenting inspiration
              — delivered straight to your inbox.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                to="/shop"
                search={{ category: undefined }}
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "oklch(0.18 0.025 285)",
                  color: "#fff",
                  boxShadow: "0 4px 20px oklch(0.18 0.025 285/0.30)",
                }}
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
