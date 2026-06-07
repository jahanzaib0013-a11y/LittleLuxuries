import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { defaultCategoryImage, type CategoryDef } from "@/hooks/use-categories";
import type { CategoryLayout } from "@/lib/content-data";
import hero from "@/assets/hero-baby.jpg";
import { cn, isUsableImageUrl, imgErrorFallback } from "@/lib/utils";

type CategorySectionProps = {
  layout: string;
  categories: CategoryDef[];
  compact?: boolean;
};

function CategoryCard({
  category,
  className,
  imageClassName,
  titleClassName,
}: {
  category: CategoryDef;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
}) {
  return (
    <Link
      to="/shop"
      search={{ category: category.name }}
      className={cn(
        "lux-hover-card lux-zoom group relative block max-w-full overflow-hidden rounded-3xl bg-muted",
        className,
      )}
    >
      <img
        src={
          isUsableImageUrl(category.image)
            ? category.image!
            : (defaultCategoryImage(category.name) ?? hero)
        }
        alt={category.name}
        loading="lazy"
        width={1024}
        height={1024}
        draggable={false}
        onError={imgErrorFallback(hero)}
        className={cn(
          "h-full w-full max-w-full object-cover transition-transform duration-700 md:group-hover:scale-105",
          imageClassName,
        )}
      />
      <div className="absolute inset-0 bg-linear-to-t from-foreground/70 via-foreground/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-background">
        <h3 className={cn("font-serif text-2xl", titleClassName)}>{category.name}</h3>
        <p className="text-sm opacity-90">{category.tagline || "Shop this collection"}</p>
      </div>
    </Link>
  );
}

function EditorialGrid({ categories, compact }: { categories: CategoryDef[]; compact?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-wrap justify-center gap-4 sm:gap-6", compact && "gap-3")}>
      {categories.map((c) => (
        <CategoryCard
          key={c.id}
          category={c}
          className={cn(
            "aspect-4/5 w-full min-w-0 max-w-full",
            compact
              ? "w-28 shrink-0 rounded-xl"
              : "sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)]",
          )}
          titleClassName={compact ? "text-sm" : undefined}
        />
      ))}
    </div>
  );
}

function MinimalCarousel({
  categories,
  compact,
}: {
  categories: CategoryDef[];
  compact?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = compact ? 120 : 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-w-0 max-w-full overflow-hidden">
      {!compact && categories.length > 1 && (
        <p className="mb-2 text-xs text-muted-foreground sm:hidden" aria-hidden>
          Swipe to browse collections →
        </p>
      )}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 overflow-x-auto overscroll-x-contain pb-4 hide-scrollbar sm:gap-6",
          compact && "gap-3 pb-2",
        )}
      >
        {categories.map((c) => (
          <CategoryCard
            key={c.id}
            category={c}
            className={cn(
              "aspect-4/5 shrink-0",
              compact ? "w-28 rounded-xl" : "w-[min(16rem,calc(100vw-2.5rem))] sm:w-72 md:w-80",
            )}
            titleClassName={compact ? "text-sm" : undefined}
          />
        ))}
      </div>
      {!compact && categories.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

function FullWidthStacks({
  categories,
  compact,
}: {
  categories: CategoryDef[];
  compact?: boolean;
}) {
  const items = compact ? categories.slice(0, 2) : categories;

  return (
    <div className={cn("space-y-12", compact && "space-y-3")}>
      {items.map((c, index) => (
        <div
          key={c.id}
          className={cn(
            "grid grid-cols-1 items-center gap-12",
            !compact && "lg:grid-cols-2",
            compact && "gap-3 grid-cols-2",
          )}
        >
          <div className={cn(!compact && index % 2 === 1 && "lg:order-2")}>
            <CategoryCard
              category={c}
              className={cn("aspect-square w-full", compact && "aspect-4/3 rounded-xl")}
              titleClassName={compact ? "text-xs" : undefined}
            />
          </div>
          <div className={cn(!compact && index % 2 === 1 && "lg:order-1", compact && "hidden")}>
            <span className="label-eyebrow">Collection</span>
            <h3 className="mt-3 font-serif text-3xl text-foreground lg:text-4xl">{c.name}</h3>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {c.tagline || "Shop this collection"}
            </p>
            <Link
              to="/shop"
              search={{ category: c.name }}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Shop {c.name}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategorySection({ layout, categories, compact }: CategorySectionProps) {
  if (categories.length === 0) return null;

  switch (layout as CategoryLayout) {
    case "Minimal Carousel":
      return <MinimalCarousel categories={categories} compact={compact} />;
    case "Full Width Stacks":
      return <FullWidthStacks categories={categories} compact={compact} />;
    case "Editorial Grid":
    default:
      return <EditorialGrid categories={categories} compact={compact} />;
  }
}
