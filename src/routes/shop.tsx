import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { products } from "@/lib/products";
import { Heart } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Little Luxuries" },
      { name: "description", content: "Browse our curated collection of organic cotton, linen, and merino wool baby garments." },
    ],
  }),
  component: Shop,
});

const categories = ["All", "Onesies", "Sleepwear", "Knitwear", "Accessories", "Gift Sets"] as const;

function Shop() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const filtered = active === "All" ? products : products.filter((p) => p.category === active);

  return (
    <Layout>
      <section className="bg-secondary/30 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="label-eyebrow">The Collection</span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">Curated Collection</h1>
          <p className="mt-5 text-muted-foreground">
            Timeless silhouettes crafted from the world's finest organic cotton and sustainable linen
            for your little one's gentle skin.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                active === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="group">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
                {p.badge && (
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    {p.badge}
                  </span>
                )}
                <button className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-card/90 text-muted-foreground backdrop-blur transition-colors hover:text-primary" aria-label="Wishlist">
                  <Heart className="size-4" />
                </button>
                <Link to="/product/$id" params={{ id: p.id }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
              </div>
              <div className="mt-5 px-1">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                    className="font-serif text-lg text-foreground transition-colors hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <span className="font-medium text-primary">${p.price}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.variant}</p>
                <Link
                  to="/product/$id"
                  params={{ id: p.id }}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Add to Cart
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
