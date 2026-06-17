import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { useStoreSettingsContext } from "@/context/StoreSettingsContext";
import { Leaf, Heart, Sparkles } from "lucide-react";
import hero from "@/assets/hero-baby.webp";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Little Luxuries Pakistan | Premium Baby Clothing" },
      {
        name: "description",
        content:
          "Crafting heirloom-quality baby garments since 2018, with care for both babies and the planet. Learn about our sustainable practices and artisan partnerships.",
      },
      {
        name: "keywords",
        content:
          "Little Luxuries story, baby clothing brand Pakistan, sustainable baby clothes, organic baby garments, artisan baby clothing",
      },
      { property: "og:title", content: "Our Story — Little Luxuries Pakistan" },
      {
        property: "og:description",
        content:
          "Heirloom baby garments hand-crafted with love since 2018. Learn about our sustainable practices.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://littleluxuries.pk/about" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://littleluxuries.pk/about",
      },
    ],
  }),
  component: About,
});

function About() {
  const { settings } = useStoreSettingsContext();
  const founderName = settings?.founder_name?.trim() || "Eleanor Vance";
  return (
    <Layout>
      <section className="bg-secondary/30 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="label-eyebrow">Our Story</span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl text-foreground md:text-6xl">
            A gentle inheritance
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Little Luxuries began with a single hand-knit blanket, passed from grandmother to mother
            to daughter — a thread of love stitched across generations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="aspect-4/5 overflow-hidden rounded-3xl shadow-(--shadow-soft)">
            <img
              src={hero}
              alt="Baby wearing organic cotton clothing from Little Luxuries"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <span className="label-eyebrow">Founded 2018</span>
            <h2 className="mt-3 font-serif text-4xl">Crafted slowly. Worn tenderly.</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              We believe a baby's first garments should be small heirlooms — gentle on skin, kind to
              the planet, and beautiful enough to keep forever.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Each piece is designed in our London studio and hand-finished in small batches by
              artisan partners across Portugal and Italy. We use only certified organic cottons,
              French linen, and pure merino wool — never plastics, never shortcuts.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6 border-t border-border pt-8">
              <Stat n="12k+" l="Families" />
              <Stat n="100%" l="Organic" />
              <Stat n="0" l="Plastic" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="label-eyebrow">Our Values</span>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">What we believe in</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Value
              icon={Leaf}
              title="Honest Materials"
              body="We trace every fiber. Only certified organic, biodegradable, and naturally dyed materials touch your baby's skin."
            />
            <Value
              icon={Heart}
              title="Fair Hands"
              body="Every artisan partner is paid a living wage and works in safe, sustainable conditions."
            />
            <Value
              icon={Sparkles}
              title="Designed to Last"
              body="Garments built for hand-me-downs, with reinforced seams and timeless silhouettes."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
        <img src={logo} alt="Little Luxuries Logo" width={100} height={100} className="mx-auto" />
        <blockquote className="mt-6 font-serif text-2xl italic leading-relaxed text-foreground md:text-3xl">
          "We are not making clothes. We are wrapping a beginning."
        </blockquote>
        <p className="mt-4 text-sm uppercase tracking-wider text-muted-foreground">
          — {founderName}, Founder
        </p>
      </section>
    </Layout>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <p className="font-serif text-3xl text-primary">{n}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{l}</p>
    </div>
  );
}

function Value({ icon: Icon, title, body }: { icon: typeof Leaf; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-card p-8 shadow-(--shadow-card)">
      <div className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-5 font-serif text-xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
