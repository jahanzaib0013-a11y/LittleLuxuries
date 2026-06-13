import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { HomePage, PromoTopBar } from "@/components/home-page";
import { useStickyPromoActive } from "@/hooks/use-sticky-promo-active";
import { contentService } from "@/lib/supabase-service";

export const Route = createFileRoute("/")({
  // Fetch published content on the server so the hero image is in the initial
  // HTML (no client-side fetch waterfall) — the key LCP win on slow networks.
  loader: async () => {
    try {
      return { content: await contentService.getSiteContent() };
    } catch {
      return { content: null };
    }
  },
  head: ({ loaderData }) => {
    const heroUrl = loaderData?.content?.heroBanner?.imageUrl;
    const preloadHero =
      typeof heroUrl === "string" && /^https?:/.test(heroUrl)
        ? [{ rel: "preload", as: "image", href: heroUrl, fetchpriority: "high" }]
        : [];
    return {
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
          content:
            "Hand-crafted, ethically-made baby garments. Gentle luxuries for your little one.",
        },
      ],
      links: preloadHero,
    };
  },
  component: Index,
});

function Index() {
  const { content } = Route.useLoaderData();
  const padForStickyPromo = useStickyPromoActive("published");
  return (
    <Layout
      beforeHeader={<PromoTopBar contentSource="published" />}
      padForStickyPromo={padForStickyPromo}
    >
      <HomePage initialContent={content} />
    </Layout>
  );
}
