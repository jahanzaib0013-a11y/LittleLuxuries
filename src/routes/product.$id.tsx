import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { products } from "@/lib/products";
import { Heart, Minus, Plus, Truck, RotateCcw, Leaf } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/hooks/use-favorites";
import { formatPkr } from "@/lib/format-currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    // First try to find in the static products array
    let product = products.find((p) => p.id === params.id);

    // If not found, try to load from Supabase
    if (!product) {
      try {
        const { productService } = await import("@/lib/supabase-service");
        const fetchedProducts = await productService.getProducts("published");
        product = fetchedProducts.find((p: any) => p.id === params.id);

        // If found in Supabase, ensure it has an image
        if (product && !product.image && product.image_url) {
          product.image = product.image_url;
        }
      } catch (error) {
        console.log("Error loading from Supabase:", error);
      }
    }

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
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [size, setSize] = useState<string>(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"sustainability" | "care">("sustainability");

  const isOutOfStock =
    product.badge === "Out of Stock" || (product.units !== undefined && product.units <= 0);

  const handleAddToCart = () => {
    addToCart(product.id, size, qty);
    toast.success(`Added ${qty} × ${product.name} (${size}) to cart`);
    openCart();
  };

  const handleBuyNow = () => {
    addToCart(product.id, size, qty);
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

  const mainImage = activeImage || product.image_url || product.image;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link
          to="/shop"
          search={{ category: undefined }}
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary"
        >
          ← Back to Shop
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          {/* Image */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-card shadow-(--shadow-card)">
              {product.badge && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  {product.badge}
                </span>
              )}
              <img
                src={mainImage}
                alt={product.name}
                width={1024}
                height={1024}
                className="h-full w-full object-cover transition-all duration-500"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[product.image_url || product.image, ...(product.secondary_images || [])]
                .slice(0, 5)
                .map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                      mainImage === img
                        ? "border-primary scale-95"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {product.category}
              </span>
              <div className="mt-2 flex items-center gap-3">
                <h1 className="font-serif text-3xl md:text-4xl text-foreground">{product.name}</h1>
                {product.badge && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold uppercase tracking-wider">
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

              <div className="flex gap-4">
                <button
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={cn(
                    "flex-1 rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-wider shadow-(--shadow-soft) transition-all",
                    isOutOfStock
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:opacity-90",
                  )}
                >
                  {isOutOfStock ? "Sold Out" : "Add to Cart"}
                </button>
                <button
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className={cn(
                    "flex-1 rounded-full border-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider shadow-(--shadow-soft) transition-all",
                    isOutOfStock
                      ? "border-muted text-muted-foreground cursor-not-allowed"
                      : "border-border text-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  Buy Now
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className={`grid size-14 place-items-center rounded-full border-2 transition-all duration-300 ${
                    isFavorite(product.id)
                      ? "border-primary bg-primary text-white scale-110"
                      : "border-border bg-card text-primary hover:bg-primary-soft hover:scale-105"
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart
                    className={`size-5 transition-all ${isFavorite(product.id) ? "fill-white scale-110" : ""}`}
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
