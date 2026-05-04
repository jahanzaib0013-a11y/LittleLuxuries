import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { ArrowRight, Leaf, Award, Smile, Star } from "lucide-react";
import { collections, products } from "@/lib/products";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero-baby.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Little Luxuries — Heirloom Baby Garments" },
      {
        name: "description",
        content:
          "Hand-crafted, ethically-made baby garments in organic cotton, linen, and merino wool. Gentle luxuries for your little one.",
      },
      { property: "og:title", content: "Little Luxuries — Heirloom Baby Garments" },
      {
        property: "og:description",
        content: "Hand-crafted, ethically-made baby garments. Gentle luxuries for your little one.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = products.slice(0, 4);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="relative z-10">
            <span className="label-eyebrow">New Collection 2026</span>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-foreground md:text-6xl lg:text-7xl">
              Gentle luxuries
              <br />
              <em className="text-primary">for your little one.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Thoughtfully designed garments that embrace your baby in the softest ethically-sourced
              materials. Timeless elegance for the modern nursery.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Shop the Collection
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Explore Our Story
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Loved by 12,000+ families worldwide
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-lilac/40 via-blush/30 to-gold/20 blur-2xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[var(--shadow-soft)]">
              <img
                src={hero}
                alt="Baby wrapped in lavender swaddle"
                width={1280}
                height={1280}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)] md:block">
              <div className="flex items-center gap-3">
                <img src={logo} alt="" width={48} height={48} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Hand-crafted</p>
                  <p className="text-sm text-muted-foreground">In small artisan batches</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO MARK */}
      <section className="bg-background py-16">
        <div className="mx-auto flex max-w-md flex-col items-center px-6 text-center">
          <img src={logo} alt="Little Luxuries" width={140} height={140} />
          <div className="divider-ornament mt-2 w-full"><span className="diamond" /></div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          <Promise icon={Leaf} title="Ethically Made" body="Responsibly sourced and sustainably produced with love for the planet." />
          <Promise icon={Award} title="Heirloom Quality" body="Standards of craftsmanship designed to last through generations." />
          <Promise icon={Smile} title="Soft on Skin" body="Hypoallergenic and ultra-soft fabrics for the most sensitive skin." />
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 flex items-end justify-between gap-4">
          <div>
            <span className="label-eyebrow">Curated Collections</span>
            <h2 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">Shop by category</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline md:inline-flex">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.name}
              to="/shop"
              className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted"
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-background">
                <h3 className="font-serif text-2xl">{c.name}</h3>
                <p className="text-sm opacity-90">{c.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-secondary/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <span className="label-eyebrow">Just Arrived</span>
            <h2 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">New for your little one</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <Link
                key={p.id}
                to="/product/$id"
                params={{ id: p.id }}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-card">
                  {p.badge && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      {p.badge}
                    </span>
                  )}
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-2">
                  <h3 className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">
                    {p.name}
                  </h3>
                  <span className="font-medium text-primary">${p.price}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.variant}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-14 text-center md:px-16 md:py-20"
          style={{ background: "var(--gradient-soft)" }}
        >
          <div className="relative z-10 mx-auto max-w-xl">
            <span className="label-eyebrow">Join the Circle</span>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Receive early access to new collections
            </h2>
            <p className="mt-3 text-muted-foreground">
              Subscribe for parenting inspiration and exclusive offers, delivered with care.
            </p>
            <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none transition-colors focus:border-primary"
              />
              <button className="rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Promise({ icon: Icon, title, body }: { icon: typeof Leaf; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-card shadow-[var(--shadow-card)]">
        <Icon className="size-6 text-primary" />
      </div>
      <h3 className="mt-5 font-serif text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
