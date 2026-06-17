import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { Heart, Search, ArrowDownUp, X, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { type Product } from "@/lib/products";
import { useFavorites } from "@/hooks/use-favorites";
import { useCategories } from "@/hooks/use-categories";
import { usePublishedProducts } from "@/lib/product-queries";
import { formatPkr } from "@/lib/format-currency";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getProductColors } from "@/lib/product-colors";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Premium Baby Clothing & Accessories — Little Luxuries Pakistan" },
      {
        name: "description",
        content:
          "Browse our curated collection of organic cotton, linen, and merino wool baby garments. Onesies, sleepwear, swaddles, and accessories handcrafted with love in Pakistan.",
      },
      {
        name: "keywords",
        content:
          "baby clothes shop, organic baby clothing, baby onesies, baby sleepwear, baby swaddles, baby accessories, Pakistan baby store",
      },
      {
        property: "og:title",
        content: "Shop Premium Baby Clothing & Accessories — Little Luxuries",
      },
      {
        property: "og:description",
        content:
          "Browse our curated collection of organic cotton, linen, and merino wool baby garments.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://littleluxuries.pk/shop" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://littleluxuries.pk/shop",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { category?: string; badge?: string } => {
    return {
      category: search.category as string | undefined,
      badge: search.badge as string | undefined,
    };
  },
  component: Shop,
});

// How many product cards to render per infinite-scroll batch. Keeps the initial
// DOM/image count low (one screenful) so images on screen load fast.
const PRODUCTS_PER_PAGE = 12;

function ProductCardImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        width={800}
        height={1067}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}

function Shop() {
  const { category: initialCategory, badge: initialBadge } = Route.useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "All");
  const [selectedBadges, setSelectedBadges] = useState<string[]>(
    initialBadge ? [initialBadge] : [],
  );
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">(
    "featured",
  );
  const { data: shopProducts = [], isLoading: loading, isError, refetch } = usePublishedProducts();
  const { categories } = useCategories();
  const badges = useMemo(
    () => Array.from(new Set(shopProducts.map((p) => p.badge).filter(Boolean) as string[])),
    [shopProducts],
  );

  // Browsable categories = admin-defined list + every category actually present
  // on a product (so nothing is unfilterable), de-duped with admin order first.
  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const name of [...categories.map((c) => c.name), ...shopProducts.map((p) => p.category)]) {
      const n = (name || "").trim();
      if (n && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  }, [categories, shopProducts]);

  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFilterType, setMobileFilterType] = useState<"category" | "status" | "budget">(
    "category",
  );
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

  // Infinite scroll: only render a window of the filtered list so the page never
  // mounts hundreds of cards/images at once. More reveal as the sentinel nears view.
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Any change to the filtered set (search/category/badge/price/sort) resets the window.
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [filtered]);

  const visibleProducts = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PRODUCTS_PER_PAGE);
        }
      },
      { rootMargin: "600px 0px" }, // start loading well before the user reaches the end
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visibleProducts.length]);

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

  const activeFilterCount =
    (selectedCategory !== "All" ? 1 : 0) +
    selectedBadges.length +
    (priceRange.min !== null || priceRange.max !== null ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSelectedBadges([]);
    setPriceRange({ min: null, max: null });
    setSearchQuery("");
  };

  return (
    <Layout>
      {/* HERO BANNER */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
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
        <div className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 h-[min(400px,80vw)] w-[min(400px,80vw)] rounded-full bg-primary/8 blur-[120px]" />
      </section>

      {/* ── PREMIUM FILTER TOOLBAR ────────────────────────────────── */}
      <div id="product-grid" className="z-30 min-w-0 overflow-x-clip md:sticky md:top-20">
        <div
          className="min-w-0"
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    aria-label={filtersOpen ? "Hide filters" : "Show filters"}
                    className={cn(
                      "relative inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-2xl transition-all touch-manipulation",
                      filtersOpen || activeFilterCount > 0
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary",
                    )}
                    style={{ color: "oklch(0.68 0.020 290)" }}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "featured" | "price-asc" | "price-desc" | "newest",
                      )
                    }
                    className="cursor-pointer rounded-2xl py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest outline-none transition-all"
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
              </div>
            </div>

            {/* FILTER ROW — toggled by sliders icon */}
            {filtersOpen && (
              <div className="min-w-0 space-y-4 border-t border-border/25 py-3 animate-in fade-in slide-in-from-top-2 duration-200 lg:flex lg:flex-wrap lg:items-start lg:gap-x-6 lg:space-y-0">
                <div className="md:hidden">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "category", label: "Category" },
                        { id: "status", label: "Status" },
                        { id: "budget", label: "Budget" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMobileFilterType(item.id)}
                        className={cn(
                          "inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200 touch-manipulation",
                          mobileFilterType === item.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={cn(
                    "min-w-0 border-b border-border/25 pb-4 lg:flex lg:max-w-full lg:flex-1 lg:flex-col lg:gap-2.5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6",
                    mobileFilterType !== "category" && "hidden md:block lg:flex",
                  )}
                >
                  <span
                    className="mb-2 block font-serif text-[12px] italic lg:mb-0"
                    style={{ color: "oklch(0.60 0.03 290)" }}
                  >
                    Category
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(["All", ...categoryOptions] as string[]).map((cat) => {
                      const on =
                        cat === "All" ? selectedCategory === "All" : selectedCategory === cat;
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setSelectedCategory(on && cat !== "All" ? "All" : cat)}
                          className="inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200 touch-manipulation sm:px-4"
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
                </div>

                <div
                  className={cn(
                    "min-w-0 border-b border-border/25 pb-4 lg:flex lg:flex-col lg:gap-2.5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6",
                    mobileFilterType !== "status" && "hidden md:block lg:flex",
                  )}
                >
                  <span
                    className="mb-2 block font-serif text-[12px] italic lg:mb-0"
                    style={{ color: "oklch(0.60 0.03 290)" }}
                  >
                    Status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => {
                      const on = selectedBadges.includes(badge);
                      const ct = shopProducts.filter((p) => p.badge === badge).length;
                      return (
                        <button
                          type="button"
                          key={badge}
                          onClick={() => toggleBadge(badge)}
                          className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200 touch-manipulation sm:px-4"
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
                            className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-black tracking-tight transition-all"
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
                </div>

                <div
                  className={cn(
                    "min-w-0 lg:flex lg:flex-col lg:gap-2.5",
                    mobileFilterType !== "budget" && "hidden md:block lg:flex",
                  )}
                >
                  <span
                    className="mb-2 block font-serif text-[12px] italic lg:mb-0"
                    style={{ color: "oklch(0.60 0.03 290)" }}
                  >
                    Budget
                  </span>
                  <div className="flex flex-wrap gap-2">
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
                          type="button"
                          key={q.label}
                          onClick={() =>
                            setPriceRange(
                              on ? { min: null, max: null } : { min: q.min, max: q.max },
                            )
                          }
                          className="inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wider transition-all duration-200 touch-manipulation sm:px-4"
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
                </div>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 touch-manipulation sm:w-auto xl:ml-auto xl:self-center"
                    style={{
                      color: "oklch(0.58 0.025 290)",
                      border: "1px solid oklch(0.89 0.012 300)",
                    }}
                  >
                    <X className="size-3" /> Reset all
                  </button>
                )}
              </div>
            )}

            {/* ACTIVE CHIPS */}
            {hasActiveFilters && (
              <div className="flex min-w-0 flex-wrap items-center gap-2 pb-2.5">
                <span
                  className="text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ color: "oklch(0.72 0.025 290)" }}
                >
                  Filtering:
                </span>
                {selectedCategory !== "All" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold touch-manipulation"
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
                    type="button"
                    key={b}
                    onClick={() => toggleBadge(b)}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold touch-manipulation"
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
                    type="button"
                    onClick={() => setPriceRange({ min: null, max: null })}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold touch-manipulation"
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
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold touch-manipulation"
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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-28 pt-8">
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
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="size-16 rounded-full mb-6 grid place-items-center"
              style={{ background: "oklch(0.93 0.03 300)" }}
            >
              <ShoppingBag className="size-6" style={{ color: "oklch(0.55 0.06 295)" }} />
            </div>
            <p
              className="text-[10px] font-black uppercase tracking-[0.22em] mb-2"
              style={{ color: "oklch(0.65 0.025 290)" }}
            >
              Couldn't load the collection
            </p>
            <h3 className="font-serif text-2xl mb-2" style={{ color: "oklch(0.25 0.03 285)" }}>
              Something went wrong
            </h3>
            <p
              className="text-sm max-w-xs leading-relaxed mb-8"
              style={{ color: "oklch(0.58 0.025 290)" }}
            >
              We couldn't reach the store just now. Please check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5"
              style={{
                background: "oklch(0.18 0.025 285)",
                color: "#fff",
                boxShadow: "0 4px 18px oklch(0.18 0.025 285/0.25)",
              }}
            >
              Try Again
            </button>
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
          <>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((p) => {
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

                        <ProductCardImage
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-contain grayscale-[0.5]"
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

                        <ProductCardImage
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.04]"
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
                      {(() => {
                        const colors = getProductColors(p);
                        if (colors.length <= 1) return null;
                        return (
                          <div
                            className="mt-2 flex flex-wrap gap-1.5"
                            aria-label="Available colors"
                          >
                            {colors.slice(0, 5).map((color) => (
                              <span
                                key={color.id}
                                title={color.name}
                                className="h-4 w-4 shrink-0 overflow-hidden rounded-full border border-border/60"
                                style={
                                  color.hex && /^#[0-9A-Fa-f]{6}$/i.test(color.hex)
                                    ? { backgroundColor: color.hex }
                                    : undefined
                                }
                              >
                                {(!color.hex || !/^#[0-9A-Fa-f]{6}$/i.test(color.hex)) &&
                                color.image_url ? (
                                  <img
                                    src={color.image_url}
                                    alt=""
                                    loading="lazy"
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-contain"
                                  />
                                ) : null}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </article>
                );
              })}
            </div>
            {hasMore && (
              <div
                ref={sentinelRef}
                className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                aria-hidden
              >
                {Array.from({
                  length: Math.min(PRODUCTS_PER_PAGE, filtered.length - visibleCount),
                }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA SECTION */}
      <section className="mx-auto max-w-7xl my-16 px-4 sm:px-6">
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
