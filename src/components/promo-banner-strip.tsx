import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PromoBanner, PromoBannerTheme, PromoBannerVariant } from "@/lib/content-data";
import { getContentIcon } from "@/lib/content-icons";
import { isExternalUrl } from "@/lib/content-links";
import { cn } from "@/lib/utils";

type PromoBannerStripProps = {
  banner: PromoBanner;
  preview?: boolean;
  /** Fixed bottom-of-viewport bar — compact horizontal layout */
  sticky?: boolean;
};

function useCountdown(endsAt: string | null) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setLabel(null);
      return;
    }
    const tick = () => {
      const end = new Date(endsAt).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setLabel(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) {
        setLabel(`${days}d ${hours}h`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setLabel(`${hours}h ${minutes}m`);
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [endsAt]);

  return label;
}

type ThemeStyle = {
  shell: string;
  glowA: string;
  glowB: string;
  iconRing: string;
  iconColor: string;
  eyebrow: string;
};

const themeStyles: Record<PromoBannerTheme, ThemeStyle> = {
  gold: {
    shell: "bg-linear-to-r from-gold/12 via-card to-primary-soft/35",
    glowA: "bg-gold/25 -left-16 top-1/2 size-32 -translate-y-1/2",
    glowB: "bg-primary/10 -right-10 top-0 size-40",
    iconRing: "text-gold",
    iconColor: "text-gold",
    eyebrow: "text-gold",
  },
  primary: {
    shell: "bg-linear-to-br from-primary-soft/55 via-card to-lilac/15",
    glowA: "bg-primary/15 -left-12 top-1/2 size-36 -translate-y-1/2",
    glowB: "bg-lilac/20 right-0 bottom-0 size-32",
    iconRing: "text-primary",
    iconColor: "text-primary",
    eyebrow: "text-primary",
  },
  blush: {
    shell: "bg-linear-to-r from-blush/35 via-card to-gold/8",
    glowA: "bg-blush/30 left-1/4 top-0 size-28 -translate-x-1/2",
    glowB: "bg-gold/15 right-1/4 bottom-0 size-24 translate-x-1/4",
    iconRing: "text-primary",
    iconColor: "text-primary",
    eyebrow: "text-primary",
  },
  lilac: {
    shell: "bg-linear-to-br from-lilac/30 via-card to-blush/20",
    glowA: "bg-lilac/25 -left-8 top-0 size-32",
    glowB: "bg-blush/20 right-0 top-1/2 size-36 -translate-y-1/2",
    iconRing: "text-primary",
    iconColor: "text-primary",
    eyebrow: "text-primary",
  },
};

const variantPadding: Record<PromoBannerVariant, string> = {
  sale: "py-5 sm:py-6",
  festival: "py-6 sm:py-8",
  minimal: "py-3 sm:py-3.5",
};

function CtaButton({ banner, variant }: { banner: PromoBanner; variant: PromoBannerVariant }) {
  const className = cn(
    "promo-banner-cta",
    variant === "minimal" && "promo-banner-cta-outline",
  );

  const inner = (
    <>
      {variant === "festival" && <Sparkles className="size-3.5 opacity-90" aria-hidden />}
      <span>{banner.buttonLabel}</span>
      <ArrowRight className="size-3.5 opacity-90" strokeWidth={2.25} />
    </>
  );

  if (isExternalUrl(banner.buttonLink)) {
    return (
      <a href={banner.buttonLink} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={banner.buttonLink} className={className}>
      {inner}
    </Link>
  );
}

function PromoCodePill({ code, compact }: { code: string; compact?: boolean }) {
  return (
    <span className="promo-banner-code max-w-full min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground shrink-0">
        Exclusive
      </span>
      <span className="h-3 w-px bg-gold/40 shrink-0" aria-hidden />
      <span
        className={cn(
          "font-serif text-sm font-semibold tracking-wide text-foreground truncate",
          compact && "max-w-[8rem]",
        )}
        title={code}
      >
        {code}
      </span>
    </span>
  );
}

function CountdownPill({ label }: { label: string }) {
  return (
    <span className="promo-banner-countdown">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Ends in
      </span>
      <span className="font-serif text-sm font-semibold text-foreground">{label}</span>
    </span>
  );
}

function IconMedallion({
  Icon,
  theme,
  size = "default",
}: {
  Icon: ReturnType<typeof getContentIcon>;
  theme: ThemeStyle;
  size?: "default" | "large";
}) {
  return (
    <div
      className={cn(
        "promo-banner-medallion shrink-0",
        size === "large" ? "size-12 sm:size-14" : "size-11 sm:size-12",
      )}
    >
      <div
        className={cn(
          "grid size-[calc(100%-6px)] place-items-center rounded-full ring-1 ring-inset",
          theme.iconRing,
          "ring-current/25 bg-card/80",
        )}
      >
        <Icon className={cn(size === "large" ? "size-5 sm:size-6" : "size-5", theme.iconColor)} strokeWidth={1.5} />
      </div>
    </div>
  );
}

export function PromoBannerStrip({ banner, preview, sticky }: PromoBannerStripProps) {
  if (!banner.isActive && !preview) return null;

  const Icon = getContentIcon(banner.iconName);
  const countdown = useCountdown(banner.endsAt);
  const alignCenter = sticky ? false : banner.textAlign === "center";
  const variant = banner.variant;
  const isMinimal = variant === "minimal";
  const isFestival = variant === "festival" && !sticky;
  const isSale = variant === "sale";
  const theme = themeStyles[banner.backgroundTheme];

  return (
    <div
      className={cn(
        "promo-banner-shell",
        theme.shell,
        sticky ? "promo-banner-sticky py-3 sm:py-3.5" : variantPadding[variant],
        preview && !banner.isActive && "opacity-90",
      )}
      role="region"
      aria-label={sticky ? "Sticky promotional offer" : "Promotional announcement"}
    >
      {!sticky && <span className={cn("promo-banner-glow", theme.glowA)} aria-hidden />}
      {!sticky && <span className={cn("promo-banner-glow", theme.glowB)} aria-hidden />}

      {preview && !banner.isActive && (
        <span
          className="pointer-events-none absolute inset-0 z-20 ring-1 ring-inset ring-primary/25"
          aria-hidden
        />
      )}

      <div
        className={cn(
          "promo-banner-inner mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          alignCenter ? "text-center" : "text-left",
        )}
      >
        {isMinimal && !sticky && (
          <div className="promo-banner-rule mb-3 max-w-3xl mx-auto" aria-hidden />
        )}

        <div
          className={cn(
            "flex gap-3 sm:gap-4",
            sticky && "flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between",
            !sticky && "flex-col gap-4 sm:gap-5",
            !sticky && alignCenter && "items-center",
            !sticky && !alignCenter && !isMinimal && "lg:flex-row lg:items-center lg:justify-between",
            !sticky && isMinimal && "sm:flex-row sm:items-center sm:justify-between sm:gap-8",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-3 sm:gap-4",
              sticky && "flex-1",
              !sticky && alignCenter && "flex-col sm:flex-row sm:justify-center",
            )}
          >
            {(!isMinimal || sticky) && (
              <div className={cn(sticky && "hidden sm:block shrink-0")}>
                <IconMedallion
                  Icon={Icon}
                  theme={theme}
                  size={sticky ? "default" : isFestival ? "large" : "default"}
                />
              </div>
            )}

            <div className={cn("min-w-0", alignCenter && "flex flex-col items-center")}>
              {banner.eyebrow && (
                <p
                  className={cn(
                    "font-sans text-[11px] font-semibold uppercase tracking-[0.22em] sm:text-xs",
                    theme.eyebrow,
                    isFestival && "mb-2",
                  )}
                >
                  {banner.eyebrow}
                </p>
              )}

              {isFestival && alignCenter && (
                <div className="divider-ornament mb-3 w-full max-w-xs" aria-hidden>
                  <span className="diamond" />
                </div>
              )}

              <p
                className={cn(
                  "text-foreground leading-[1.2] tracking-tight",
                  sticky && "font-serif text-base font-medium sm:text-lg line-clamp-2",
                  !sticky &&
                    isMinimal &&
                    "font-sans text-sm font-medium tracking-[0.02em] sm:text-[15px]",
                  !sticky && isSale && "font-serif text-xl font-medium sm:text-2xl",
                  !sticky &&
                    isFestival &&
                    "font-serif text-2xl font-medium sm:text-[1.75rem] md:text-3xl",
                )}
              >
                {banner.headline}
              </p>

              {!sticky && !isMinimal && banner.description && (
                <p
                  className={cn(
                    "mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[15px]",
                    alignCenter && "mx-auto",
                    isFestival && "italic",
                  )}
                >
                  {banner.description}
                </p>
              )}
            </div>
          </div>

          {(countdown || banner.showPromoCode || banner.showButton) && (
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 sm:gap-3 min-w-0",
                sticky && "justify-start sm:justify-end sm:shrink-0",
                !sticky && alignCenter && "justify-center",
                !sticky && !alignCenter && "lg:pl-4",
              )}
            >
              {countdown && <CountdownPill label={countdown} />}
              {banner.showPromoCode && banner.promoCode && (
                <PromoCodePill code={banner.promoCode} compact={sticky} />
              )}
              {banner.showButton && banner.buttonLabel && (
                <CtaButton banner={banner} variant={variant} />
              )}
            </div>
          )}
        </div>

        {isMinimal && !sticky && (
          <div className="promo-banner-rule mt-3 max-w-3xl mx-auto" aria-hidden />
        )}

        {isFestival && !alignCenter && (
          <div className="divider-ornament mt-5 max-w-md opacity-70" aria-hidden>
            <span className="diamond" />
          </div>
        )}
      </div>
    </div>
  );
}
