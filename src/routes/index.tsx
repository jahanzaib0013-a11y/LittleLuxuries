import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { HomePage, PromoTopBar } from "@/components/home-page";
import { useStickyPromoActive } from "@/hooks/use-sticky-promo-active";
import heroImage from "@/assets/hero-baby.jpg";

export const Route = createFileRoute("/")({
  // No server loader: the app renders client-side (shell SSR), so awaiting a
  // Supabase fetch here only delayed TTFB without painting anything sooner.
  // The hero is the bundled asset, so we statically preload it instead — the
  // browser starts fetching it from the initial HTML, in parallel with the JS.
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
    links: [{ rel: "preload", as: "image", href: heroImage, fetchpriority: "high" }],
  }),
  component: Index,
});

function Index() {
  const padForStickyPromo = useStickyPromoActive("published");
  return (
    <Layout
      beforeHeader={<PromoTopBar contentSource="published" />}
      padForStickyPromo={padForStickyPromo}
    >
      <HomePage />
    </Layout>
  );
}
