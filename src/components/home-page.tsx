import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Leaf, CheckCircle2, Loader2, Heart } from "lucide-react";
import { products, type Product } from "@/lib/products";
import { productService } from "@/lib/supabase-service";
import { useCategories } from "@/hooks/use-categories";
import { useBadges } from "@/hooks/use-badges";
import { useFavorites } from "@/hooks/use-favorites";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero-baby.jpg";
import { subscribeToNewsletter } from "@/lib/email.server";
import { formatPkr } from "@/lib/format-currency";
import { validateEmail } from "@/lib/form-validation";
import { useSiteContent } from "@/hooks/use-site-content";
import { useStickyPromoActive } from "@/hooks/use-sticky-promo-active";
import { useCart } from "@/context/CartContext";
import type { SiteContentSource } from "@/lib/content-data";
import { isExternalUrl } from "@/lib/content-links";
import { getContentIcon, getPromiseIcon, isStarIcon } from "@/lib/content-icons";
import { CategorySection } from "@/components/category-section";
import { PromoBannerStrip } from "@/components/promo-banner-strip";
import type { PromoBanner, PromoBannerPlacements } from "@/lib/content-data";
import { cn } from "@/lib/utils";

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
export function PromoTopBar({ contentSource = "published" }: { contentSource?: SiteContentSource }) {
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
};

/** Shared landing page body — used by `/` and `/storefront` preview. */
export function HomePage({ contentSource = "published" }: HomePageProps) {
  const { content } = useSiteContent({ source: contentSource });
  const heroImageSrc = content.heroBanner.imageUrl ?? hero;
  const { categories } = useCategories();
  const { badges } = useBadges();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [realProducts, setRealProducts] = useState<Product[]>(products);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetched = await productService.getProducts("published");
        if (fetched.length > 0) {
          const formatted = fetched.map((p) => ({
            ...p,
            image: p.image_url || products[0]?.image,
          }));
          setRealProducts(formatted as Product[]);
        }
      } catch (err) {
        console.error("Failed to fetch products for home page", err);
      }
    };
    fetchProducts();
  }, []);

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
    "group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:shadow-lg hover:-translate-y-0.5";

  const promo = content.promoBanner;
  const stickyPromoActive = useStickyPromoActive(contentSource);

  return (
    <div className={cn(stickyPromoActive && "pb-28 sm:pb-32")}>
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="relative z-10">
            <span className="label-eyebrow">{content.heroBanner.seasonTag}</span>
            <h1 className="mt-5 font-serif text-4xl leading-[1.05] text-foreground break-words sm:text-5xl md:text-6xl lg:text-7xl">
              {content.heroBanner.headline.split("\n").map((line, i) => (
                <span key={i}>
                  {i === 0 ? line : <em className="text-primary">{line}</em>}
                  {i === 0 && content.heroBanner.headline.includes("\n") && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              {content.heroBanner.description}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
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
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Explore Our Story
              </Link>
            </div>

            {content.heroBanner.showSocialProof && (() => {
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
                  <p className="text-xs text-muted-foreground">{content.heroBanner.socialProofText}</p>
                </div>
              );
            })()}
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-linear-to-br from-lilac/40 via-blush/30 to-gold/20 blur-2xl" />
            <div className="relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-(--shadow-soft)">
              <img
                src={heroImageSrc}
                alt="Baby wrapped in lavender swaddle"
                width={1280}
                height={1280}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-(--shadow-card) md:block">
              <div className="flex items-center gap-3">
                <img src={logo} alt="" width={48} height={48} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {content.heroBanner.badgeTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">{content.heroBanner.badgeSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto flex max-w-md flex-col items-center px-6 text-center">
          <img src={logo} alt="Little Luxuries" width={140} height={140} />
          <div className="divider-ornament mt-2 w-full">
            <span className="diamond" />
          </div>
        </div>
      </section>

      <PromoAt banner={promo} placement="aboveBrandPromises" />

      {content.announcementBar.isActive && (
        <section className="bg-secondary/40 py-20">
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
      )}

      <PromoAt banner={promo} placement="belowBrandPromises" />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12">
          <span className="label-eyebrow">Curated Collections</span>
          <h2 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">Shop by category</h2>
        </div>

        <CategorySection layout={content.layout} categories={categories} />
      </section>

      {badges.map((badge, index) => {
        const badgeProducts = realProducts.filter(
          (p) =>
            p.badge === badge.name &&
            !(p.badge === "Out of Stock" || (p.units !== undefined && p.units <= 0)),
        );
        if (badgeProducts.length === 0) return null;

        return (
          <section
            key={badge.id}
            className={`py-24 ${index % 2 === 0 ? "bg-secondary/40" : "bg-background"}`}
          >
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-12 text-center">
                <span className="label-eyebrow">Curated for you</span>
                <h2 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">
                  {badge.name === "New" ? "New Arrivals" : badge.name}
                </h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {badgeProducts.map((p) => {
                  const isOutOfStock =
                    p.badge === "Out of Stock" || (p.units !== undefined && p.units <= 0);
                  return (
                    <div key={p.id} className={cn("group block", isOutOfStock && "opacity-80")}>
                      {isOutOfStock ? (
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-card cursor-not-allowed">
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
                            className="h-full w-full object-cover grayscale-[0.5]"
                          />
                        </div>
                      ) : (
                        <Link to="/product/$id" params={{ id: p.id }}>
                          <div className="relative aspect-square overflow-hidden rounded-2xl bg-card">
                            {p.badge && (
                              <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                                {p.badge}
                              </span>
                            )}
                            <button
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
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </div>
                        </Link>
                      )}
                      <div className="mt-4 flex items-baseline justify-between gap-2 min-w-0">
                        {isOutOfStock ? (
                          <h3 className="min-w-0 flex-1 truncate font-serif text-lg text-foreground/60 cursor-not-allowed">
                            {p.name}
                          </h3>
                        ) : (
                          <Link to="/product/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                            <h3 className="truncate font-serif text-lg text-foreground transition-colors group-hover:text-primary">
                              {p.name}
                            </h3>
                          </Link>
                        )}
                        <span className="shrink-0 font-medium text-primary">{formatPkr(Number(p.price))}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.variant}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      <section className="mx-auto max-w-5xl px-6 py-24">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-14 text-center md:px-16 md:py-20"
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
                <span className="label-eyebrow">Join the Circle</span>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl">
                  Receive early access to new collections
                </h2>
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

      <StickyPromoBar banner={promo} />
    </div>
  );
}
