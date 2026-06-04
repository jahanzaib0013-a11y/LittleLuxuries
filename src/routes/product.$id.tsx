import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { queryClient } from "@/lib/query-client";
import { productDetailQueryOptions } from "@/lib/product-queries";
import { Heart, Minus, Plus, Truck, RotateCcw, Leaf } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/hooks/use-favorites";
import { formatPkr } from "@/lib/format-currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductColorSwatches } from "@/components/product-color-swatches";
import {
  getDefaultColor,
  getGalleryImagesForColor,
  getProductColors,
} from "@/lib/product-colors";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const product = await queryClient.ensureQueryData(productDetailQueryOptions(params.id));
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Little Luxuries` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <Layout>
      <div className="mx-auto max-w-md py-32 text-center">
        <h1 className="font-serif text-3xl">Product not found</h1>
        <Link
          to="/shop"
          search={{ category: undefined }}
          className="mt-4 inline-block text-primary hover:underline"
        >
          Back to shop
        </Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout>
      <div className="mx-auto max-w-md py-32 text-center">
        <h1 className="font-serif text-3xl">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    </Layout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const productColors = useMemo(() => getProductColors(product), [product]);
  const defaultColor = useMemo(() => getDefaultColor(productColors), [productColors]);
  const [selectedColorId, setSelectedColorId] = useState(defaultColor?.id ?? "");
  const selectedColor = useMemo(
    () => productColors.find((c) => c.id === selectedColorId) ?? defaultColor,
    [productColors, selectedColorId, defaultColor],
  );
  const [size, setSize] = useState<string>(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"sustainability" | "care">("sustainability");

  const isOutOfStock =
    product.badge === "Out of Stock" || (product.units !== undefined && product.units <= 0);

  const colorLabel = selectedColor?.name?.trim() || "";

  const handleAddToCart = () => {
    addToCart(product.id, size, qty, colorLabel);
    const colorPart = colorLabel ? `, ${colorLabel}` : "";
    toast.success(`Added ${qty} × ${product.name} (${size}${colorPart}) to cart`);
    openCart();
  };

  const handleBuyNow = () => {
    addToCart(product.id, size, qty, colorLabel);
    navigate({ to: "/checkout" });
  };

  const handleToggleFavorite = () => {
    const wasFavorite = isFavorite(product.id);
    toggleFavorite(product.id);
    if (!wasFavorite) {
      toast.success(`Added ${product.name} to favorites`, {
        icon: <Heart className="size-4 fill-primary text-primary" />,
      });
    } else {
      toast.info(`Removed ${product.name} from favorites`);
    }
  };

  const galleryImages = useMemo(
    () => getGalleryImagesForColor(selectedColor),
    [selectedColor],
  );

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/shop"
          search={{ category: undefined }}
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary"
        >
          ← Back to Shop
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
          <ProductImageGallery
            images={galleryImages}
                alt={product.name}
            badge={product.badge}
          />

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {product.category}
              </span>
              <div className="mt-2 flex flex-wrap items-start gap-2 sm:gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground break-words">
                  {product.name}
                </h1>
                {product.badge && (
                  <span className="inline-flex shrink-0 items-center px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold uppercase tracking-wider">
                    {product.badge}
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-semibold text-primary">
                {formatPkr(Number(product.price))}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-base leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>

            {productColors.length > 0 ? (
              <ProductColorSwatches
                colors={productColors}
                selectedId={selectedColor?.id ?? ""}
                onSelect={(color) => setSelectedColorId(color.id)}
                className="border-t border-border pt-8"
              />
            ) : null}

            <div className="border-y border-border py-8">
              <p className="text-sm font-medium uppercase tracking-wider text-foreground mb-4">
                Select Size
              </p>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-full border-2 px-6 py-3 text-sm font-medium transition-all ${
                      size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-border pb-8">
              <p className="text-sm font-medium uppercase tracking-wider text-foreground mb-4">
                Quantity
              </p>
              <div className="inline-flex items-center gap-1 rounded-full border-2 border-border bg-card p-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="grid size-10 place-items-center rounded-full hover:bg-muted transition-colors"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-12 text-center text-lg font-medium">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="grid size-10 place-items-center rounded-full hover:bg-muted transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-6">
              {isOutOfStock && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-sm font-bold text-red-900 uppercase tracking-widest">
                    Currently Out of Stock
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className={cn(
                      "min-h-11 w-full rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-wider shadow-(--shadow-soft) transition-all sm:flex-1",
                      isOutOfStock
                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:opacity-90",
                    )}
                  >
                    {isOutOfStock ? "Sold Out" : "Add to Cart"}
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className={cn(
                      "min-h-11 w-full rounded-full border-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider shadow-(--shadow-soft) transition-all sm:flex-1",
                      isOutOfStock
                        ? "cursor-not-allowed border-muted text-muted-foreground"
                        : "border-border text-foreground hover:bg-primary hover:text-primary-foreground",
                    )}
                  >
                    Buy Now
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={cn(
                    "mx-auto grid min-h-11 min-w-11 place-items-center rounded-full border-2 transition-all duration-300 sm:mx-0 sm:size-14",
                    isFavorite(product.id)
                      ? "scale-110 border-primary bg-primary text-white"
                      : "border-border bg-card text-primary hover:scale-105 hover:bg-primary-soft",
                  )}
                  aria-label="Wishlist"
                >
                  <Heart
                    className={cn(
                      "size-5 transition-all",
                      isFavorite(product.id) && "scale-110 fill-white",
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-12 border-t border-border pt-8">
              <div className="flex gap-8 border-b border-border">
                {(["sustainability", "care"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative pb-4 text-sm font-medium capitalize transition-colors ${
                      tab === t
                        ? "text-foreground border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "care" ? "Care Instructions" : "Sustainability"}
                  </button>
                ))}
              </div>
              <div className="mt-6 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                {tab === "sustainability" &&
                  (product.sustainability ? (
                    <p>{product.sustainability}</p>
                  ) : (
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>100% certified organic, GOTS-grown materials</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Natural wood buttons and non-toxic, low-impact dyes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Crafted in small batches by artisan partners</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary">•</span>
                        <span>Recyclable, plastic-free packaging</span>
                      </li>
                    </ul>
                  ))}
                {tab === "care" && (
                  <p>
                    {product.care_instructions ||
                      "Machine wash cold on a delicate cycle with mild detergent. Lay flat to dry to preserve softness and shape. Iron on low if needed."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Perk({ icon: Icon, title, body }: { icon: typeof Truck; title: string; body: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
