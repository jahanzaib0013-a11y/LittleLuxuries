import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { products } from "@/lib/products";
import { Heart, Minus, Plus, Truck, RotateCcw, Leaf } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = products.find((p) => p.id === params.id);
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
        <Link to="/shop" className="mt-4 inline-block text-primary hover:underline">
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
  const [size, setSize] = useState<string>(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"sustainability" | "care" | "gift">("sustainability");

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/shop" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary">
          ← Back to Shop
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          {/* Image */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
              {product.badge && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  {product.badge}
                </span>
              )}
              <img src={product.image} alt={product.name} width={1024} height={1024} className="h-full w-full object-cover" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                    i === 0 ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={product.image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <span className="label-eyebrow">{product.category}</span>
            <h1 className="mt-3 font-serif text-4xl md:text-5xl">{product.name}</h1>
            <p className="mt-4 font-serif text-3xl text-primary">${product.price}.00</p>
            <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-8">
              <p className="label-eyebrow mb-3 !text-foreground">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-full border px-5 py-2.5 text-sm transition-all ${
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

            <div className="mt-8">
              <p className="label-eyebrow mb-3 !text-foreground">Quantity</p>
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid size-9 place-items-center rounded-full hover:bg-muted">
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="grid size-9 place-items-center rounded-full hover:bg-muted">
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <Link
                to="/checkout"
                className="flex-1 rounded-full bg-primary px-8 py-4 text-center text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:opacity-90"
              >
                Add to Cart
              </Link>
              <button className="grid size-14 place-items-center rounded-full border border-border bg-card text-primary transition-colors hover:bg-primary-soft" aria-label="Wishlist">
                <Heart className="size-5" />
              </button>
            </div>

            <div className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
              <Perk icon={Truck} title="Complimentary Shipping" body="On orders over $150" />
              <Perk icon={RotateCcw} title="Simple Returns" body="30-day graceful window" />
            </div>

            {/* Tabs */}
            <div className="mt-10 border-t border-border pt-8">
              <div className="flex gap-6 border-b border-border">
                {(["sustainability", "care", "gift"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative pb-3 text-sm font-medium capitalize transition-colors ${
                      tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "gift" ? "Gift Wrapping" : t === "care" ? "Care Instructions" : "Sustainability"}
                    {tab === t && <span className="absolute -bottom-px left-0 h-0.5 w-full bg-gold" />}
                  </button>
                ))}
              </div>
              <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
                {tab === "sustainability" && (
                  <ul className="space-y-2">
                    <li>• 100% certified organic, GOTS-grown materials</li>
                    <li>• Natural wood buttons and non-toxic, low-impact dyes</li>
                    <li>• Crafted in small batches by artisan partners</li>
                    <li>• Recyclable, plastic-free packaging</li>
                  </ul>
                )}
                {tab === "care" && (
                  <p>Machine wash cold on a delicate cycle with mild detergent. Lay flat to dry to preserve softness and shape. Iron on low if needed.</p>
                )}
                {tab === "gift" && (
                  <p>Add complimentary gift wrapping at checkout — your piece arrives in our signature lavender keepsake box, hand-tied with gold ribbon.</p>
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
