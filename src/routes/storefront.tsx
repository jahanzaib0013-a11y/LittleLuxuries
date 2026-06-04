import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { HomePage, PromoTopBar } from "@/components/home-page";
import { useStickyPromoActive } from "@/hooks/use-sticky-promo-active";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/storefront")({
  head: () => ({
    meta: [{ title: "Storefront Preview — Little Luxuries" }],
  }),
  component: StorefrontPage,
});

function StorefrontPage() {
  const padForStickyPromo = useStickyPromoActive("preview");
  return (
    <Layout
      beforeHeader={<PromoTopBar contentSource="preview" />}
      padForStickyPromo={padForStickyPromo}
    >
      <div
        className="sticky top-16 sm:top-20 z-30 border-b border-primary/20 bg-primary-soft/90 px-4 py-2.5 text-center text-sm text-foreground backdrop-blur-sm"
        role="status"
      >
        <span className="inline-flex items-center justify-center gap-2 flex-wrap">
          <Eye className="size-4 text-primary shrink-0" aria-hidden />
          <span>
            <strong className="font-medium">Live preview</strong> — matches the{" "}
            <Link to="/" className="font-medium text-primary underline-offset-2 hover:underline">
              landing page
            </Link>{" "}
            as you edit in the Homepage Editor (about 150ms). The live landing page (/) updates only
            after <strong className="font-medium">Save Changes</strong>.
          </span>
        </span>
      </div>
      <HomePage contentSource="preview" />
    </Layout>
  );
}
