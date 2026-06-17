import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Leaf, CheckCircle2, Loader2, Heart } from "lucide-react";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import { usePublishedProducts } from "@/lib/product-queries";
import { useCategories } from "@/hooks/use-categories";
import { useBadges } from "@/hooks/use-badges";
import { useFavorites } from "@/hooks/use-favorites";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero-baby.webp";
import { subscribeToNewsletter } from "@/lib/email.server";
import { formatPkr } from "@/lib/format-currency";
import { validateEmail } from "@/lib/form-validation";
import { useSiteContent } from "@/hooks/use-site-content";
import { useStickyPromoActive } from "@/hooks/use-sticky-promo-active";
import { useCart } from "@/context/CartContext";
import type { SiteContent, SiteContentSource } from "@/lib/content-data";
import { isExternalUrl } from "@/lib/content-links";
import { getContentIcon, getPromiseIcon, isStarIcon } from "@/lib/content-icons";
import { CategorySection } from "@/components/category-section";
import { defaultCategoryImage } from "@/hooks/use-categories";
import { CraftStory } from "@/components/craft-story";
import { BackgroundAnimation } from "@/components/background-animation";
import { AnimationTemplateProvider, HeroStagger, Reveal } from "@/components/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { Parallax } from "@/components/motion/parallax";
import { TiltCard } from "@/components/motion/tilt-card";
import { Magnetic } from "@/components/motion/magnetic";
import { CountUp } from "@/components/motion/count-up";
import { PromoBannerStrip } from "@/components/promo-banner-strip";
import type { PromoBanner, PromoBannerPlacements } from "@/lib/content-data";
import { cn, isUsableImageUrl, imgErrorFallback } from "@/lib/utils";

function PromoAt({
  banner,
  placement,
}: {
  banner: PromoBanner;
  placement: keyof PromoBannerPlacements;
}) {
  if (!banner.isActive || !banner.placements[placement]) return null;
  if (placement === "stickyBottom" || placement === "top") return null;
  return <PromoBannerStrip banner={banner} />;
}

/** Page-top promo — renders above the site header via Layout `beforeHeader`. */
export function PromoTopBar({
  contentSource = "published",
}: {
  contentSource?: SiteContentSource;
}) {
  const { content } = useSiteContent({ source: contentSource });
  const promo = content.promoBanner;
  if (!promo.isActive || !promo.placements.top) return null;
  return <PromoBannerStrip banner={promo} />;
}

function StickyPromoBar({ banner }: { banner: PromoBanner }) {
  const { isCartOpen } = useCart();
  if (!banner.isActive || !banner.placements.stickyBottom || isCartOpen) return null;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none px-3 sm:px-4 pb-[max(0px,env(safe-area-inset-bottom))]"
      role="complementary"
      aria-label="Sticky promotional offer"
    >
      <div className="pointer-events-auto w-full max-w-7xl shadow-[0_-8px_32px_-8px_oklch(0.45_0.13_295_/_0.2)]">
        <PromoBannerStrip banner={banner} sticky />
      </div>
    </div>
  );
}

function Promise({ icon: Icon, title, body }: { icon: typeof Leaf; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-card shadow-(--shadow-card)">
        <Icon className="size-6 text-primary" />
      </div>
      <h3 className="mt-5 font-serif text-lg text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

type HomePageProps = {
  /** `published` on `/` (saved only). `preview` on `/storefront` (live while editing). */
  contentSource?: SiteContentSource;
  /** Server-rendered content from the route loader (SSR hero, no fetch waterfall). */
  initialContent?: SiteContent | null;
};

/** Shared landing page body — used by `/` and `/storefront` preview. */
export function HomePage({ contentSource = "published", initialContent }: HomePageProps) {
  const { content } = useSiteContent({ source: contentSource, initialContent });
  const heroImageSrc = isUsableImageUrl(content.heroBanner.imageUrl)
    ? content.heroBanner.imageUrl!
    : hero;
  const { categories } = useCategories();
  const { badges } = useBadges();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { data: fetchedProducts, isLoading: productsLoading } = usePublishedProducts();
  // While the catalog is loading, render nothing product-derived (and show
  // skeletons in the rows) rather than the bundled sample SKUs — those have
  // placeholder names and demo prices that briefly flashed as "real" products.
  const realProducts = fetchedProducts ?? [];

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailError, setEmailError] = useState<string | undefined>();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEmail(email);
    if (validation) {
      setEmailError(validation);
      setStatus("idle");
      return;
    }
    setEmailError(undefined);
    setStatus("loading");
    try {
      await (subscribeToNewsletter as any)({ data: { email: email.trim() } });
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const primaryCtaClass =
    "lux-hover-cta group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:shadow-lg hover:-translate-y-0.5";
  // Only surface categories that actually have published products, so a card
  // never leads to an empty shop. De-dupe by name, cap at 5, and give each a
  // sensible image: uploaded image → known default-by-name → a product photo
  // from that category (so cards look right even before images are uploaded).
  const categoryProductNames = new Set(realProducts.map((p) => p.category));
  const homepageCategories = categories
    .filter((category, index, self) => index === self.findIndex((c) => c.name === category.name))
    .filter((category) => categoryProductNames.has(category.name))
    .slice(0, 5)
    .map((category) => {
      if (isUsableImageUrl(category.image) || defaultCategoryImage(category.name)) return category;
      const productImg = realProducts.find(
        (p) => p.category === category.name && isUsableImageUrl(p.image),
      )?.image;
      return productImg ? { ...category, image: productImg } : category;
    });

  const promo = content.promoBanner;
  const stickyPromoActive = useStickyPromoActive(contentSource);

  return (
    <AnimationTemplateProvider value={content.animationTemplate ?? "couture"}>
      <div
        data-anim-template={content.animationTemplate ?? "couture"}
        className={cn(stickyPromoActive && "pb-28 sm:pb-32", "min-w-0 overflow-x-clip")}
      >
        <Reveal index={0}>
          <section
            className="lux-grain relative overflow-hidden"
            style={{ background: "var(--gradient-hero)" }}
          >
            <BackgroundAnimation variant={content.backgroundAnimation ?? "orbs"} />
            {/* Blend the animated colours into the page so the section below
                doesn't cut off abruptly. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40"
              style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
            />
            <div className="relative z-[1] mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_1fr] lg:py-32">
              <HeroStagger as="div" className="relative z-10">
                <span className="label-eyebrow">{content.heroBanner.seasonTag}</span>
                <RevealText
                  as="h1"
                  text={content.heroBanner.headline}
                  emphasisClassName="italic text-primary"
                  className="display-serif mt-6 text-[2.75rem] text-foreground break-words sm:text-6xl md:text-7xl xl:text-[5rem]"
                />
                <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                  {content.heroBanner.description}
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Magnetic>
                    {isExternalUrl(content.heroBanner.buttonLink) ? (
                      <a
                        href={content.heroBanner.buttonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={primaryCtaClass}
                      >
                        {content.heroBanner.buttonLabel}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    ) : (
                      <Link to={content.heroBanner.buttonLink} className={primaryCtaClass}>
                        {content.heroBanner.buttonLabel}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    )}
                  </Magnetic>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Explore Our Story
                  </Link>
                </div>

                {content.heroBanner.showSocialProof &&
                  (() => {
                    const SocialProofIcon = getContentIcon(content.heroBanner.socialProofIconName);
                    const starStyle = isStarIcon(content.heroBanner.socialProofIconName);
                    return (
                      <div className="mt-12 flex items-center gap-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <SocialProofIcon
                              key={i}
                              className={cn(
                                "size-3.5",
                                starStyle ? "fill-gold text-gold" : "text-primary",
                              )}
                            />
                          ))}
                        </div>
                        <CountUp
                          text={content.heroBanner.socialProofText}
                          className="text-xs text-muted-foreground"
                        />
                      </div>
                    );
                  })()}
              </HeroStagger>

              <Parallax className="relative" factor={-1}>
                <div className="relative hero-img">
                  <div className="absolute -inset-6 rounded-[2.5rem] bg-linear-to-br from-lilac/40 via-blush/30 to-gold/20 blur-2xl" />
                  <div className="lux-img-ring relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-(--shadow-soft)">
                    <img
                      src={heroImageSrc}
                      alt="Baby wrapped in lavender swaddle"
                      width={1024}
                      height={1280}
                      fetchPriority="high"
                      decoding="async"
                      onError={imgErrorFallback(hero)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-(--shadow-card) md:block">
                    <div className="flex items-center gap-3">
                      <img src={logo} alt="Little Luxuries Logo" width={48} height={48} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {content.heroBanner.badgeTitle}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {content.heroBanner.badgeSubtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Parallax>
            </div>
          </section>
        </Reveal>

        <Reveal index={1}>
          <section className="bg-background py-20">
            <div className="mx-auto flex max-w-md flex-col items-center px-6 text-center">
              <img src={logo} alt="Little Luxuries" width={140} height={140} />
              <div className="divider-ornament mt-2 w-full">
                <span className="diamond" />
              </div>
            </div>
          </section>
        </Reveal>

        <PromoAt banner={promo} placement="aboveBrandPromises" />

        {content.announcementBar.isActive && (
          <Reveal index={2}>
            <section className="bg-secondary/40 py-24">
              <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
                {content.announcementBar.promises.map((promise, index) => {
                  const Icon = getPromiseIcon(promise, index);
                  return (
                    <Promise
                      key={index}
                      icon={Icon}
                      title={promise.title}
                      body={promise.description}
                    />
                  );
                })}
              </div>
            </section>
          </Reveal>
        )}

        <PromoAt banner={promo} placement="belowBrandPromises" />

        <Reveal index={3}>
          <section className="mx-auto min-w-0 max-w-7xl overflow-x-clip px-4 py-24 sm:px-6 sm:py-32">
            <div className="mb-14">
              <span className="label-eyebrow">Curated Collections</span>
              <RevealText
                as="h2"
                text="Shop by category"
                className="display-serif mt-4 text-4xl text-foreground break-words sm:text-5xl md:text-6xl"
              />
            </div>

            <CategorySection layout={content.layout} categories={homepageCategories} />
          </section>
        </Reveal>

        <CraftStory story={content.craftStory} />

        {productsLoading && (
          <section className="overflow-x-clip bg-secondary/40 py-24 sm:py-32">
            <div className="mx-auto min-w-0 max-w-7xl px-4 sm:px-6">
              <div className="mb-14 flex flex-col items-center text-center">
                <span className="label-eyebrow">Curated for you</span>
                <h2 className="display-serif mt-4 text-4xl text-foreground break-words sm:text-5xl md:text-6xl">
                  Our Collection
                </h2>
              </div>
              <ProductGridSkeleton count={8} />
            </div>
          </section>
        )}

        {!productsLoading &&
          badges.map((badge, index) => {
          const badgeProducts = realProducts.filter(
            (p) =>
              p.badge === badge.name &&
              !(p.badge === "Out of Stock" || (p.units !== undefined && p.units <= 0)),
          );
          if (badgeProducts.length === 0) return null;
          const HOMEPAGE_ROW_LIMIT = 8;
          const visibleProducts = badgeProducts.slice(0, HOMEPAGE_ROW_LIMIT);

          return (
            <Reveal key={badge.id} index={index + 4}>
              <section
                className={cn(
                  "overflow-x-clip py-24 sm:py-32",
                  index % 2 === 0 ? "bg-secondary/40" : "bg-background",
                )}
              >
                <div className="mx-auto min-w-0 max-w-7xl px-4 sm:px-6">
                  <div className="mb-14 flex flex-col items-center text-center">
                    <span className="label-eyebrow">Curated for you</span>
                    <RevealText
                      as="h2"
                      text={badge.name === "New" ? "New Arrivals" : badge.name}
                      className="display-serif mt-4 text-4xl text-foreground break-words sm:text-5xl md:text-6xl"
                    />
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleProducts.map((p) => {
                      const isOutOfStock =
                        p.badge === "Out of Stock" || (p.units !== undefined && p.units <= 0);
                      return (
                        <div
                          key={p.id}
                          className={cn(
                            "group min-w-0 max-w-full",
                            isOutOfStock ? "opacity-80" : "lux-hover-card",
                          )}
                        >
                          {isOutOfStock ? (
                            <div className="relative aspect-square w-full max-w-full overflow-hidden rounded-2xl bg-card cursor-not-allowed">
                              <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="px-6 py-2 rounded-full border-2 border-white/80 text-white text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl">
                                  Sold Out
                                </span>
                              </div>
                              <img
                                src={p.image}
                                alt={p.name}
                                loading="lazy"
                                width={1024}
                                height={1024}
                                draggable={false}
                                onError={imgErrorFallback(hero)}
                                className="h-full w-full max-w-full object-contain grayscale-[0.5]"
                              />
                            </div>
                          ) : (
                            <Link
                              to="/product/$id"
                              params={{ id: p.id }}
                              className="block min-w-0 max-w-full"
                            >
                              <TiltCard className="lux-zoom lux-img-ring relative aspect-square w-full max-w-full overflow-hidden rounded-2xl bg-card">
                                {p.badge && (
                                  <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                                    {p.badge}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite(p.id);
                                  }}
                                  className="absolute right-3 top-3 z-20 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/80 text-primary backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                                >
                                  <Heart
                                    className={`size-4 ${isFavorite(p.id) ? "fill-primary" : ""}`}
                                  />
                                </button>
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  loading="lazy"
                                  width={1024}
                                  height={1024}
                                  draggable={false}
                                  onError={imgErrorFallback(hero)}
                                  className="h-full w-full max-w-full object-contain transition-transform duration-700 md:group-hover:scale-105"
                                />
                              </TiltCard>
                            </Link>
                          )}
                          <div className="mt-4 flex items-baseline justify-between gap-2 min-w-0">
                            {isOutOfStock ? (
                              <h3 className="min-w-0 flex-1 truncate font-serif text-lg text-foreground/60 cursor-not-allowed">
                                {p.name}
                              </h3>
                            ) : (
                              <Link
                                to="/product/$id"
                                params={{ id: p.id }}
                                className="min-w-0 flex-1"
                              >
                                <h3 className="truncate font-serif text-lg text-foreground transition-colors group-hover:text-primary">
                                  {p.name}
                                </h3>
                              </Link>
                            )}
                            <span className="shrink-0 font-medium text-primary">
                              {formatPkr(Number(p.price))}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{p.variant}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-12 flex justify-center">
                    <Link
                      to="/shop"
                      search={{ badge: badge.name }}
                      className="lux-hover-cta group inline-flex items-center gap-2 rounded-full border border-border bg-card px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      See more
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </section>
            </Reveal>
          );
        })}

        <Reveal index={badges.length + 4}>
          <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
            <div
              className="lux-grain lux-img-ring relative overflow-hidden rounded-3xl px-8 py-16 text-center shadow-(--shadow-soft) md:px-16 md:py-24"
              style={{ background: "var(--gradient-soft)" }}
            >
              <div className="relative z-10 mx-auto max-w-xl">
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-500">
                    <div className="rounded-full bg-white p-4 shadow-sm mb-4 text-green-500">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h3 className="font-serif text-3xl text-foreground">You're in the Circle.</h3>
                    <p className="mt-3 text-muted-foreground text-center">
                      Check your inbox for your exclusive welcome gift and 10% off code.
                    </p>
                  </div>
                ) : (
                  <>
                    <span className="label-eyebrow justify-center">Join the Circle</span>
                    <RevealText
                      as="h2"
                      text="Receive early access to new collections"
                      className="display-serif mt-4 text-3xl md:text-5xl"
                    />
                    <p className="mt-3 text-muted-foreground">
                      Subscribe for parenting inspiration and exclusive offers, delivered with care.
                    </p>
                    <form
                      className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2"
                      onSubmit={handleSubscribe}
                      noValidate
                    >
                      <div className="flex-1 text-left">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError(undefined);
                          }}
                          placeholder="Your email address"
                          aria-invalid={Boolean(emailError)}
                          className={cn(
                            "w-full rounded-full border bg-card px-5 py-3.5 text-sm outline-none transition-colors focus:border-primary",
                            emailError ? "border-destructive" : "border-border",
                          )}
                        />
                        {emailError && (
                          <p className="mt-2 text-sm text-destructive" role="alert">
                            {emailError}
                          </p>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
                      >
                        {status === "loading" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Subscribe"
                        )}
                      </button>
                    </form>
                    {status === "error" && !emailError && (
                      <p className="mt-3 text-sm text-destructive text-center" role="alert">
                        Something went wrong. Please try again later.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </Reveal>

        <StickyPromoBar banner={promo} />
      </div>
    </AnimationTemplateProvider>
  );
}
