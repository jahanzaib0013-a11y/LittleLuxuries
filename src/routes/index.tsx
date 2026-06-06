import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { HomePage, PromoTopBar } from "@/components/home-page";
import { useStickyPromoActive } from "@/hooks/use-sticky-promo-active";

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
