import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { type Product } from "@/lib/products";
import { useFavorites } from "@/hooks/use-favorites";
import { usePublishedProducts } from "@/lib/product-queries";
import { formatPkr } from "@/lib/format-currency";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "My Favorites — Little Luxuries Pakistan" },
      {
        name: "description",
        content:
          "Save your favorite baby clothing and accessories. Create a wishlist of organic cotton onesies, sleepwear, swaddles, and more.",
      },
      {
        name: "keywords",
        content: "baby wishlist, favorites, baby clothes wishlist, save baby products",
      },
      { property: "og:title", content: "My Favorites — Little Luxuries" },
      {
        property: "og:description",
        content: "Save your favorite baby clothing and accessories.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://littleluxuries.pk/favorites" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://littleluxuries.pk/favorites",
      },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, openCart } = useCart();
  const { data: allProducts = [], isLoading: loading } = usePublishedProducts();

  const favoritedProducts = allProducts.filter((p) => favorites.includes(p.id));

  const handleAddToCart = (product: Product) => {
    const defaultSize = product.sizes?.[0] || "One Size";
    addToCart(product.id, defaultSize, 1);
    openCart();
  };

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 text-center">
          <span className="label-eyebrow">Your Collection</span>
          <h1 className="mt-3 font-serif text-4xl text-foreground md:text-5xl italic">
            Saved Favorites
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl w-full" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/3 rounded-md" />
              </div>
            ))}
          </div>
        ) : favoritedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-primary-soft/60 shadow-(--shadow-card)">
              <Heart className="size-8 text-primary/40" />
            </div>
            <div className="divider-ornament mx-auto mt-7 w-40">
              <span className="diamond" />
            </div>
            <h2 className="mt-6 font-serif text-3xl italic text-foreground">
              Your wishlist awaits
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Tap the heart on any piece you love and it will be kept here, ready when you are.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-hover)"
            >
              Discover the collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {favoritedProducts.map((p) => {
              const isOutOfStock =
                p.badge === "Out of Stock" || (p.units !== undefined && p.units <= 0);
              return (
                <article key={p.id} className={cn("group relative", isOutOfStock && "opacity-80")}>
                  {isOutOfStock ? (
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-card cursor-not-allowed">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(p.id);
                        }}
                        className="absolute right-3 top-3 z-20 rounded-full bg-white p-2 text-primary shadow-sm transition-all hover:scale-110"
                      >
                        <Heart className="size-4 fill-primary" />
                      </button>
                      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-6 py-2 rounded-full border-2 border-white/80 text-white text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl">
                          Sold Out
                        </span>
                      </div>
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-contain grayscale-[0.5]"
                      />
                    </div>
                  ) : (
                    <Link to="/product/$id" params={{ id: p.id }} className="block">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-card">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(p.id);
                          }}
                          className="absolute right-3 top-3 z-20 rounded-full bg-white p-2 text-primary shadow-sm transition-all hover:scale-110"
                        >
                          <Heart className="size-4 fill-primary" />
                        </button>
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(p);
                          }}
                          className="absolute bottom-3 left-3 right-3 z-10 flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/90 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary opacity-100 shadow-sm backdrop-blur-sm transition-all hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <ShoppingBag className="size-3.5 shrink-0" aria-hidden />
                          Add to Cart
                        </button>
                      </div>
                    </Link>
                  )}
                  <div className="mt-4 flex items-baseline justify-between gap-2 px-1">
                    {isOutOfStock ? (
                      <h3 className="font-serif text-lg text-foreground/60 cursor-not-allowed truncate">
                        {p.name}
                      </h3>
                    ) : (
                      <Link to="/product/$id" params={{ id: p.id }}>
                        <h3 className="font-serif text-lg text-foreground transition-colors group-hover:text-primary truncate">
                          {p.name}
                        </h3>
                      </Link>
                    )}
                    <span className="font-medium text-primary">{formatPkr(Number(p.price))}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
