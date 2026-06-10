import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Megaphone,
  LayoutGrid,
  GalleryThumbnails,
  Layers,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowRight,
  Star,
  Leaf,
  Award,
  Heart,
  Shield,
  Sparkles,
  Gem,
  Cloud,
  Sun,
  Moon,
  Flower,
  Trees,
  Droplet,
  Wind,
  Flame,
  Zap,
  Package,
  Truck,
  RefreshCw,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Building,
  Home,
  ShoppingBag,
  CreditCard,
  Tag,
  Percent,
  Gift,
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  TrendingUp,
  Target,
  Award as AwardIcon,
  Heart as HeartIcon,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import {
  loadPublishedContent,
  loadPublishedContentAsync,
  mergeSiteContent,
  publishContentPreview,
  saveContentAsync,
  CATEGORY_LAYOUTS,
  ANIMATION_TEMPLATES,
  BACKGROUND_ANIMATIONS,
  SITE_CONTENT_LIMITS,
  SiteContent,
  withinCharLimit,
  type PromoBanner,
  type PromoBannerPlacements,
  type PromoBannerTheme,
  type PromoBannerVariant,
  defaultPromoPlacements,
} from "@/lib/content-data";
import { PromoBannerStrip } from "@/components/promo-banner-strip";
import { CONTENT_ICONS, getContentIcon, getPromiseIcon, isStarIcon } from "@/lib/content-icons";
import { toast } from "sonner";
import { CategorySection } from "@/components/category-section";
import { useCategories } from "@/hooks/use-categories";
import hero from "@/assets/hero-baby.webp";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/content")({
  head: () => ({ meta: [{ title: "Content Editor — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout
      searchPlaceholder="Search content, assets, or settings…"
      rightSlot={
        <Button
          onClick={() => window.open("/storefront", "_blank")}
          variant="outline"
          className="rounded-full h-10"
        >
          Storefront View
        </Button>
      }
    >
      <ContentPage />
    </AdminLayout>
  ),
});

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <div className="mt-1 text-xs text-muted-foreground text-right">
      {value.length}/{max} characters
    </div>
  );
}

function ContentPage() {
  const [content, setContent] = useState<SiteContent>(loadPublishedContent());
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [heroImage, setHeroImage] = useState<string>(hero);
  const [editingBadge, setEditingBadge] = useState(false);
  const [iconSelector, setIconSelector] = useState<
    | { target: "promise"; promiseIndex: number }
    | { target: "socialProof" }
    | { target: "promo" }
    | null
  >(null);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { categories } = useCategories();
  const heroImageRef = useRef(hero);

  useEffect(() => {
    heroImageRef.current = heroImage;
  }, [heroImage]);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    loadPublishedContentAsync().then((savedContent) => {
      setContent(savedContent);
      setHeroImage(savedContent.heroBanner.imageUrl ?? hero);
    });
  }, []);

  // Ensure content state is always fresh
  useEffect(() => {
    const handleStorageChange = () => {
      const savedContent = loadPublishedContent();
      setContent(savedContent);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const buildPreviewSnapshot = (next: SiteContent): SiteContent => ({
    ...next,
    heroBanner: { ...next.heroBanner, imageUrl: heroImageRef.current },
  });

  const syncPreview = (snapshot: SiteContent, immediate = false) => {
    const run = () => publishContentPreview(snapshot);
    if (immediate) {
      if (previewSyncTimerRef.current) clearTimeout(previewSyncTimerRef.current);
      run();
      return;
    }
    if (previewSyncTimerRef.current) clearTimeout(previewSyncTimerRef.current);
    previewSyncTimerRef.current = setTimeout(run, 150);
  };

  useEffect(() => {
    return () => {
      if (previewSyncTimerRef.current) clearTimeout(previewSyncTimerRef.current);
    };
  }, []);

  const updateContent = (
    updates: Partial<SiteContent>,
    options?: { immediatePreview?: boolean; skipPreview?: boolean },
  ) => {
    setContent((prev) => {
      const newContent = mergeSiteContent(prev, updates);
      if (!options?.skipPreview) {
        syncPreview(buildPreviewSnapshot(newContent), options?.immediatePreview ?? false);
      }
      return newContent;
    });
    setHasChanges(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setHeroImage(imageUrl);
        heroImageRef.current = imageUrl;
        setContent((prev) => {
          const newContent = mergeSiteContent(prev, {
            heroBanner: { ...prev.heroBanner, imageUrl },
          });
          syncPreview(newContent, true);
          return newContent;
        });
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const updatePromiseIcon = (promiseIndex: number, iconName: string) => {
    const newPromises = [...content.announcementBar.promises];
    newPromises[promiseIndex] = { ...newPromises[promiseIndex], iconName };
    updateContent({ announcementBar: { ...content.announcementBar, promises: newPromises } });
    setIconSelector(null);
  };

  const updateSocialProofIcon = (iconName: string) => {
    updateContent(
      { heroBanner: { ...content.heroBanner, socialProofIconName: iconName } },
      { immediatePreview: true },
    );
    setIconSelector(null);
  };

  const updatePromoIcon = (iconName: string) => {
    updateContent(
      { promoBanner: { ...content.promoBanner, iconName } },
      { immediatePreview: true },
    );
    setIconSelector(null);
  };

  const promoPlacements = content.promoBanner.placements ?? defaultPromoPlacements;

  const PLACEMENT_OPTIONS: {
    key: keyof PromoBannerPlacements;
    label: string;
    hint: string;
  }[] = [
    {
      key: "top",
      label: "Page top",
      hint: "Above the site header and primary hero",
    },
    {
      key: "stickyBottom",
      label: "Below screen (sticky)",
      hint: "Fixed to the bottom of the viewport while scrolling",
    },
    {
      key: "aboveBrandPromises",
      label: "Above brand promises",
      hint: "Below the logo, above the three columns",
    },
    {
      key: "belowBrandPromises",
      label: "Below brand promises",
      hint: "Under the promise columns",
    },
  ];

  const updatePromoBanner = (
    partial: Partial<PromoBanner>,
    options?: { immediatePreview?: boolean; skipPreview?: boolean },
  ) => {
    setContent((prev) => {
      const newContent = mergeSiteContent(prev, {
        promoBanner: { ...prev.promoBanner, ...partial },
      });
      if (!options?.skipPreview) {
        syncPreview(buildPreviewSnapshot(newContent), options?.immediatePreview ?? false);
      }
      return newContent;
    });
    setHasChanges(true);
  };

  const handleIconSelect = (iconName: string) => {
    if (!iconSelector) return;
    if (iconSelector.target === "promise") {
      updatePromiseIcon(iconSelector.promiseIndex, iconName);
    } else if (iconSelector.target === "socialProof") {
      updateSocialProofIcon(iconName);
    } else if (iconSelector.target === "promo") {
      updatePromoIcon(iconName);
    }
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const payload: SiteContent = {
        ...content,
        heroBanner: { ...content.heroBanner, imageUrl: heroImage },
      };
      publishContentPreview(payload);
      const result = await saveContentAsync(payload);
      setContent(payload);
      setHasChanges(false);
      if (result.success) {
        if (result.error) {
          toast.warning(result.error);
        } else {
          toast.success("Homepage saved. Promo banner, hero, and all sections are updated.");
        }
      } else {
        toast.error(result.error ?? "Failed to save content.");
      }
    } catch (error) {
      console.error("Failed to save content:", error);
      toast.error("Failed to save content.");
    } finally {
      setSaving(false);
    }
  };

  const openStorefront = () => {
    window.open("/storefront", "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground">
          Homepage Editor
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Curate the boutique experience.{" "}
          <strong className="font-medium text-foreground">Storefront</strong> (/storefront) previews
          edits live. The public homepage (/) and cloud copy update only when you press Save
          Changes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hero banner card */}
          <div className="rounded-2xl bg-card p-7 shadow-(--shadow-card)">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Primary Hero Banner</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Visible on / after Save Changes. Storefront preview updates live while you edit.
                </p>
              </div>
              <Button
                onClick={saveAllChanges}
                disabled={!hasChanges || saving}
                className="rounded-full"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Two-column hero layout with image */}
            <div className="mt-6 rounded-xl bg-linear-to-br from-primary-soft/60 via-card to-[color:var(--color-blush)]/30 p-6 sm:p-10 relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
                <div className="relative z-10">
                  <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                    {content.heroBanner.seasonTag}
                  </div>
                  <div className="mt-5 font-serif text-4xl leading-[1.05] text-foreground break-words sm:text-5xl md:text-6xl lg:text-7xl whitespace-pre-wrap max-w-full">
                    {content.heroBanner.headline.split("\n").map((line, i) => (
                      <span key={i}>
                        {i === 0 ? line : <em className="text-primary">{line}</em>}
                        {i === 0 && <br />}
                      </span>
                    ))}
                  </div>
                  <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                    {content.heroBanner.description}
                  </p>
                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => window.open(content.heroBanner.buttonLink, "_blank")}
                      className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      {content.heroBanner.buttonLabel}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
                      Explore Our Story
                    </button>
                  </div>
                  {content.heroBanner.showSocialProof &&
                    (() => {
                      const SocialProofIcon = getContentIcon(
                        content.heroBanner.socialProofIconName,
                      );
                      const starStyle = isStarIcon(content.heroBanner.socialProofIconName);
                      return (
                        <div className="mt-12 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIconSelector({ target: "socialProof" })}
                            className="flex rounded-lg p-1 -m-1 hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Click to change icons"
                          >
                            {[...Array(5)].map((_, i) => (
                              <SocialProofIcon
                                key={i}
                                className={`size-3.5 ${starStyle ? "fill-gold text-gold" : "text-primary"}`}
                              />
                            ))}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {content.heroBanner.socialProofText}
                          </p>
                        </div>
                      );
                    })()}
                </div>
                <div className="relative">
                  <div className="absolute -inset-6 rounded-[2.5rem] bg-linear-to-br from-lilac/40 via-blush/30 to-gold/20 blur-2xl" />
                  <div className="relative">
                    <div
                      className="relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-(--shadow-soft) cursor-pointer group"
                      onClick={triggerFileInput}
                    >
                      <img
                        src={heroImage}
                        alt="Hero banner"
                        width={1280}
                        height={1280}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-sm font-medium">Click to change image</div>
                          <div className="text-xs opacity-80 mt-1">Upload new photo</div>
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    {heroImage !== hero && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroImage(hero);
                          setContent((prev) => ({
                            ...prev,
                            heroBanner: { ...prev.heroBanner, imageUrl: undefined },
                          }));
                          setHasChanges(true);
                        }}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/90 hover:bg-card text-foreground shadow-md flex items-center justify-center z-10 transition-colors"
                        title="Reset to default image"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-(--shadow-card) md:block">
                    <div className="flex items-center gap-3">
                      <img src={logo} alt="" width={48} height={48} />
                      {editingBadge ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={content.heroBanner.badgeTitle}
                            maxLength={SITE_CONTENT_LIMITS.badgeTitle}
                            onChange={(e) => {
                              if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.badgeTitle))
                                return;
                              updateContent({
                                heroBanner: { ...content.heroBanner, badgeTitle: e.target.value },
                              });
                            }}
                            className="text-xs font-semibold uppercase tracking-wider text-primary bg-transparent border-b border-primary/30 outline-none w-36"
                            onKeyDown={(e) => e.key === "Enter" && setEditingBadge(false)}
                            autoFocus
                          />
                          <input
                            type="text"
                            value={content.heroBanner.badgeSubtitle}
                            maxLength={SITE_CONTENT_LIMITS.badgeSubtitle}
                            onChange={(e) => {
                              if (
                                !withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.badgeSubtitle)
                              )
                                return;
                              updateContent({
                                heroBanner: {
                                  ...content.heroBanner,
                                  badgeSubtitle: e.target.value,
                                },
                              });
                            }}
                            className="text-sm text-muted-foreground bg-transparent border-b border-border outline-none w-48"
                            onBlur={() => setEditingBadge(false)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingBadge(false)}
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingBadge(true)}
                          className="cursor-pointer group"
                          title="Click to edit"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary group-hover:text-primary/80 transition-colors">
                            {content.heroBanner.badgeTitle}
                          </p>
                          <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                            {content.heroBanner.badgeSubtitle}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Season Tag (eyebrow)
                </Label>
                <Input
                  value={content.heroBanner.seasonTag}
                  maxLength={SITE_CONTENT_LIMITS.seasonTag}
                  onChange={(e) => {
                    if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.seasonTag)) return;
                    updateContent({
                      heroBanner: { ...content.heroBanner, seasonTag: e.target.value },
                    });
                  }}
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  placeholder="New Collection 2026"
                />
                <CharCount
                  value={content.heroBanner.seasonTag}
                  max={SITE_CONTENT_LIMITS.seasonTag}
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Banner Headline
                </Label>
                <Textarea
                  value={content.heroBanner.headline}
                  onChange={(e) => {
                    if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.headline)) return;
                    updateContent({
                      heroBanner: { ...content.heroBanner, headline: e.target.value },
                    });
                  }}
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl resize-none"
                  placeholder="Enter headline with newline for second line..."
                  maxLength={SITE_CONTENT_LIMITS.headline}
                />
                <CharCount value={content.heroBanner.headline} max={SITE_CONTENT_LIMITS.headline} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Input
                  value={content.heroBanner.description}
                  maxLength={SITE_CONTENT_LIMITS.description}
                  onChange={(e) => {
                    if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.description)) return;
                    updateContent({
                      heroBanner: { ...content.heroBanner, description: e.target.value },
                    });
                  }}
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                />
                <CharCount
                  value={content.heroBanner.description}
                  max={SITE_CONTENT_LIMITS.description}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Badge Title
                  </Label>
                  <Input
                    value={content.heroBanner.badgeTitle}
                    maxLength={SITE_CONTENT_LIMITS.badgeTitle}
                    onChange={(e) => {
                      if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.badgeTitle)) return;
                      updateContent({
                        heroBanner: { ...content.heroBanner, badgeTitle: e.target.value },
                      });
                    }}
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  />
                  <CharCount
                    value={content.heroBanner.badgeTitle}
                    max={SITE_CONTENT_LIMITS.badgeTitle}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Badge Subtitle
                  </Label>
                  <Input
                    value={content.heroBanner.badgeSubtitle}
                    maxLength={SITE_CONTENT_LIMITS.badgeSubtitle}
                    onChange={(e) => {
                      if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.badgeSubtitle))
                        return;
                      updateContent({
                        heroBanner: { ...content.heroBanner, badgeSubtitle: e.target.value },
                      });
                    }}
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  />
                  <CharCount
                    value={content.heroBanner.badgeSubtitle}
                    max={SITE_CONTENT_LIMITS.badgeSubtitle}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Button Label
                  </Label>
                  <Input
                    value={content.heroBanner.buttonLabel}
                    maxLength={SITE_CONTENT_LIMITS.buttonLabel}
                    onChange={(e) => {
                      if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.buttonLabel)) return;
                      updateContent({
                        heroBanner: { ...content.heroBanner, buttonLabel: e.target.value },
                      });
                    }}
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  />
                  <CharCount
                    value={content.heroBanner.buttonLabel}
                    max={SITE_CONTENT_LIMITS.buttonLabel}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Button Link (URL)
                  </Label>
                  <Input
                    value={content.heroBanner.buttonLink}
                    maxLength={SITE_CONTENT_LIMITS.buttonLink}
                    onChange={(e) => {
                      if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.buttonLink)) return;
                      updateContent({
                        heroBanner: { ...content.heroBanner, buttonLink: e.target.value },
                      });
                    }}
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                    placeholder="/shop or https://..."
                  />
                  <CharCount
                    value={content.heroBanner.buttonLink}
                    max={SITE_CONTENT_LIMITS.buttonLink}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-border/20 p-4 mt-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Social proof (stars + line)
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Show the rating row below the hero buttons on the live site.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateContent(
                        {
                          heroBanner: {
                            ...content.heroBanner,
                            showSocialProof: !content.heroBanner.showSocialProof,
                          },
                        },
                        { immediatePreview: true },
                      )
                    }
                    className={`h-6 w-11 shrink-0 rounded-full relative transition-colors ${
                      content.heroBanner.showSocialProof ? "bg-gold" : "bg-muted-foreground/30"
                    }`}
                    aria-label={
                      content.heroBanner.showSocialProof ? "Hide social proof" : "Show social proof"
                    }
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition-transform ${
                        content.heroBanner.showSocialProof ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                {content.heroBanner.showSocialProof && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Social proof icons
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground mb-2">
                        Shown 5× in a row (default: stars). Click to pick from the icon library.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIconSelector({ target: "socialProof" })}
                        className="inline-flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 px-4 py-3 hover:bg-primary/10 transition-colors"
                      >
                        <div className="flex">
                          {(() => {
                            const Icon = getContentIcon(content.heroBanner.socialProofIconName);
                            const starStyle = isStarIcon(content.heroBanner.socialProofIconName);
                            return [...Array(5)].map((_, i) => (
                              <Icon
                                key={i}
                                className={`size-4 ${starStyle ? "fill-gold text-gold" : "text-primary"}`}
                              />
                            ));
                          })()}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {content.heroBanner.socialProofIconName} — Change icon
                        </span>
                      </button>
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Social proof text
                      </Label>
                      <Input
                        value={content.heroBanner.socialProofText}
                        maxLength={SITE_CONTENT_LIMITS.socialProofText}
                        onChange={(e) => {
                          if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.socialProofText))
                            return;
                          updateContent({
                            heroBanner: {
                              ...content.heroBanner,
                              socialProofText: e.target.value,
                            },
                          });
                        }}
                        className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                        placeholder="Loved by 12,000+ families worldwide"
                      />
                      <CharCount
                        value={content.heroBanner.socialProofText}
                        max={SITE_CONTENT_LIMITS.socialProofText}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Promises Section */}
          <div className="rounded-2xl bg-card p-7 shadow-(--shadow-card)">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Brand Promises</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Edit titles, descriptions, and icons below. Press Save Changes to update the live
                  site and preview.
                </p>
              </div>
              <Button
                onClick={saveAllChanges}
                disabled={!hasChanges || saving}
                className="rounded-full shrink-0"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border/20 bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Show section on site</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Off hides the section on / after Save Changes. Storefront preview updates live
                  while you edit.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {content.announcementBar.isActive ? "On" : "Off"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateContent(
                      {
                        announcementBar: {
                          ...content.announcementBar,
                          isActive: !content.announcementBar.isActive,
                        },
                      },
                      { skipPreview: true },
                    )
                  }
                  className={`h-6 w-11 rounded-full relative transition-colors ${
                    content.announcementBar.isActive ? "bg-gold" : "bg-muted-foreground/30"
                  }`}
                  aria-label={
                    content.announcementBar.isActive
                      ? "Hide brand promises on site"
                      : "Show brand promises on site"
                  }
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition-transform ${
                      content.announcementBar.isActive ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="mt-6">
              <div className="rounded-xl bg-linear-to-br from-primary-soft/60 via-card to-[color:var(--color-blush)]/30 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {content.announcementBar.promises.map((promise, index) => {
                    const Icon = getPromiseIcon(promise, index);
                    return (
                      <div key={index} className="text-center">
                        <button
                          onClick={() =>
                            setIconSelector({ target: "promise", promiseIndex: index })
                          }
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4 hover:bg-primary/20 transition-colors cursor-pointer group"
                          title="Click to change icon"
                        >
                          <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                        </button>
                        <h3 className="font-serif text-lg text-primary mb-2">{promise.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {promise.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Edit Fields */}
            <div className="mt-8 space-y-6">
              {content.announcementBar.promises.map((promise, index) => {
                const Icon = getPromiseIcon(promise, index);
                return (
                  <div key={index} className="rounded-xl border border-border/20 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => setIconSelector({ target: "promise", promiseIndex: index })}
                        className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer group"
                        title="Click to change icon"
                      >
                        <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                      </button>
                      <h4 className="font-serif text-lg text-foreground">Promise {index + 1}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Title
                        </Label>
                        <Input
                          value={promise.title}
                          maxLength={SITE_CONTENT_LIMITS.promiseTitle}
                          onChange={(e) => {
                            if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.promiseTitle))
                              return;
                            const newPromises = [...content.announcementBar.promises];
                            newPromises[index] = { ...promise, title: e.target.value };
                            updateContent({
                              announcementBar: {
                                ...content.announcementBar,
                                promises: newPromises,
                              },
                            });
                          }}
                          className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                        />
                        <CharCount value={promise.title} max={SITE_CONTENT_LIMITS.promiseTitle} />
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Description
                        </Label>
                        <Input
                          value={promise.description}
                          maxLength={SITE_CONTENT_LIMITS.promiseDescription}
                          onChange={(e) => {
                            if (
                              !withinCharLimit(
                                e.target.value,
                                SITE_CONTENT_LIMITS.promiseDescription,
                              )
                            )
                              return;
                            const newPromises = [...content.announcementBar.promises];
                            newPromises[index] = { ...promise, description: e.target.value };
                            updateContent({
                              announcementBar: {
                                ...content.announcementBar,
                                promises: newPromises,
                              },
                            });
                          }}
                          className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                        />
                        <CharCount
                          value={promise.description}
                          max={SITE_CONTENT_LIMITS.promiseDescription}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Icon Selector Modal */}
            {iconSelector && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-xl text-foreground">
                      {iconSelector.target === "socialProof"
                        ? "Choose social proof icon"
                        : iconSelector.target === "promo"
                          ? "Choose promo banner icon"
                          : "Choose promise icon"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIconSelector(null)}
                      className="flex min-h-10 min-w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {CONTENT_ICONS.map(({ name, icon: Icon }) => {
                      const isSelected =
                        iconSelector.target === "socialProof"
                          ? content.heroBanner.socialProofIconName === name
                          : iconSelector.target === "promo"
                            ? content.promoBanner.iconName === name
                            : content.announcementBar.promises[iconSelector.promiseIndex]
                                ?.iconName === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleIconSelect(name)}
                          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors group ${
                            isSelected
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "bg-muted/40 hover:bg-primary/10"
                          }`}
                          title={name}
                        >
                          <Icon
                            className={`h-6 w-6 transition-colors ${
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-primary"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Sale / Festival promo banner */}
          <div className="rounded-2xl bg-card p-7 shadow-(--shadow-card)">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Sale / Festival Banner</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Promo strip for sales and festivals. Turn on and choose where it appears on / and
                  /storefront (same content can show in multiple spots).
                </p>
              </div>
              <Button
                onClick={saveAllChanges}
                disabled={!hasChanges || saving}
                className="rounded-full shrink-0"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border/20 bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Show banner on site</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Must be on for placements below. Storefront preview updates live; the homepage (/)
                  and cloud update when you Save Changes.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {content.promoBanner.isActive ? "On" : "Off"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updatePromoBanner(
                      { isActive: !content.promoBanner.isActive },
                      { immediatePreview: true },
                    )
                  }
                  className={`h-6 w-11 rounded-full relative transition-colors ${
                    content.promoBanner.isActive ? "bg-gold" : "bg-muted-foreground/30"
                  }`}
                  aria-label={
                    content.promoBanner.isActive
                      ? "Hide promo banner on site"
                      : "Show promo banner on site"
                  }
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition-transform ${
                      content.promoBanner.isActive ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-border/20 bg-muted/20 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Where to show</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Enable one or more locations. Same banner copy appears in each selected spot.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {PLACEMENT_OPTIONS.map(({ key, label, hint }) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${
                      promoPlacements[key]
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/30 bg-card/50"
                    } ${!content.promoBanner.isActive ? "opacity-60" : ""}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={promoPlacements[key]}
                      disabled={!content.promoBanner.isActive}
                      onChange={() =>
                        updatePromoBanner(
                          {
                            placements: {
                              ...promoPlacements,
                              [key]: !promoPlacements[key],
                            },
                          },
                          { immediatePreview: true },
                        )
                      }
                    />
                    <span>
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {content.promoBanner.isActive && !Object.values(promoPlacements).some(Boolean) && (
                <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
                  Turn on at least one location or the banner will not appear on the storefront.
                </p>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                In-page preview
              </p>
              <div className="overflow-hidden rounded-xl border border-border/40 shadow-(--shadow-card)">
                <PromoBannerStrip banner={content.promoBanner} preview />
              </div>
              {promoPlacements.stickyBottom && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sticky bottom preview
                  </p>
                  <div className="overflow-hidden rounded-t-xl border border-border/40 shadow-(--shadow-card)">
                    <PromoBannerStrip banner={content.promoBanner} preview sticky />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Banner style
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["sale", "festival", "minimal"] as PromoBannerVariant[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updatePromoBanner({ variant: v }, { immediatePreview: true })}
                      className={`rounded-full px-4 py-2 text-sm capitalize transition-colors ${
                        content.promoBanner.variant === v
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-foreground hover:bg-primary/10"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Background theme
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["gold", "primary", "blush", "lilac"] as PromoBannerTheme[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        updatePromoBanner({ backgroundTheme: t }, { immediatePreview: true })
                      }
                      className={`rounded-full px-4 py-2 text-sm capitalize transition-colors ${
                        content.promoBanner.backgroundTheme === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-foreground hover:bg-primary/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Text alignment
                </Label>
                <div className="mt-2 flex gap-2">
                  {(["center", "left"] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() =>
                        updatePromoBanner({ textAlign: align }, { immediatePreview: true })
                      }
                      className={`rounded-full px-4 py-2 text-sm capitalize transition-colors ${
                        content.promoBanner.textAlign === align
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-foreground hover:bg-primary/10"
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Icon
                </Label>
                <button
                  type="button"
                  onClick={() => setIconSelector({ target: "promo" })}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-border/30 bg-muted/30 px-4 py-3 hover:bg-primary/10 transition-colors"
                >
                  {(() => {
                    const Icon = getContentIcon(content.promoBanner.iconName);
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  <span className="text-sm text-muted-foreground">
                    {content.promoBanner.iconName} — Change icon
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Eyebrow
                  </Label>
                  <Input
                    value={content.promoBanner.eyebrow}
                    maxLength={SITE_CONTENT_LIMITS.promoEyebrow}
                    onChange={(e) => {
                      if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.promoEyebrow))
                        return;
                      updatePromoBanner({ eyebrow: e.target.value });
                    }}
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  />
                  <CharCount
                    value={content.promoBanner.eyebrow}
                    max={SITE_CONTENT_LIMITS.promoEyebrow}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Headline
                  </Label>
                  <Input
                    value={content.promoBanner.headline}
                    maxLength={SITE_CONTENT_LIMITS.promoHeadline}
                    onChange={(e) => {
                      if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.promoHeadline))
                        return;
                      updatePromoBanner({ headline: e.target.value });
                    }}
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  />
                  <CharCount
                    value={content.promoBanner.headline}
                    max={SITE_CONTENT_LIMITS.promoHeadline}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Input
                  value={content.promoBanner.description}
                  maxLength={SITE_CONTENT_LIMITS.promoDescription}
                  onChange={(e) => {
                    if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.promoDescription))
                      return;
                    updatePromoBanner({ description: e.target.value });
                  }}
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                />
                <CharCount
                  value={content.promoBanner.description}
                  max={SITE_CONTENT_LIMITS.promoDescription}
                />
              </div>

              <div className="rounded-xl border border-border/20 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Promo code</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shown as a pill on the banner
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updatePromoBanner(
                        { showPromoCode: !content.promoBanner.showPromoCode },
                        { immediatePreview: true },
                      )
                    }
                    className={`h-6 w-11 shrink-0 rounded-full relative transition-colors ${
                      content.promoBanner.showPromoCode ? "bg-gold" : "bg-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition-transform ${
                        content.promoBanner.showPromoCode ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <Input
                  value={content.promoBanner.promoCode}
                  maxLength={SITE_CONTENT_LIMITS.promoCode}
                  onChange={(e) => {
                    if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.promoCode)) return;
                    updatePromoBanner({ promoCode: e.target.value.toUpperCase() });
                  }}
                  className="h-12 bg-muted/40 border-0 rounded-xl font-mono uppercase"
                  placeholder="LUXE10"
                />
                <CharCount
                  value={content.promoBanner.promoCode}
                  max={SITE_CONTENT_LIMITS.promoCode}
                />
              </div>

              <div className="rounded-xl border border-border/20 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-foreground">Call-to-action button</p>
                  <button
                    type="button"
                    onClick={() =>
                      updatePromoBanner(
                        { showButton: !content.promoBanner.showButton },
                        { immediatePreview: true },
                      )
                    }
                    className={`h-6 w-11 shrink-0 rounded-full relative transition-colors ${
                      content.promoBanner.showButton ? "bg-gold" : "bg-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition-transform ${
                        content.promoBanner.showButton ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Button label
                    </Label>
                    <Input
                      value={content.promoBanner.buttonLabel}
                      maxLength={SITE_CONTENT_LIMITS.buttonLabel}
                      onChange={(e) => {
                        if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.buttonLabel))
                          return;
                        updatePromoBanner({ buttonLabel: e.target.value });
                      }}
                      className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Button link
                    </Label>
                    <Input
                      value={content.promoBanner.buttonLink}
                      maxLength={SITE_CONTENT_LIMITS.buttonLink}
                      onChange={(e) => {
                        if (!withinCharLimit(e.target.value, SITE_CONTENT_LIMITS.buttonLink))
                          return;
                        updatePromoBanner({ buttonLink: e.target.value });
                      }}
                      className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                      placeholder="/shop"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Countdown end (optional)
                </Label>
                <p className="mt-1 text-xs text-muted-foreground mb-2">
                  Leave empty to hide the timer. Shows days/hours remaining when set.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="datetime-local"
                    value={
                      content.promoBanner.endsAt ? content.promoBanner.endsAt.slice(0, 16) : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      updatePromoBanner(
                        { endsAt: val ? new Date(val).toISOString() : null },
                        { immediatePreview: true },
                      );
                    }}
                    className="h-12 bg-muted/40 border-0 rounded-xl max-w-xs"
                  />
                  {content.promoBanner.endsAt && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        updatePromoBanner({ endsAt: null }, { immediatePreview: true })
                      }
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Category layout preview */}
          <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
            <div className="flex items-center gap-2 text-sm mb-4">
              <Eye className="h-4 w-4 text-primary" /> Category layout preview
            </div>
            <div className="space-y-4 overflow-hidden">
              {isClient ? (
                <CategorySection
                  layout={content.layout}
                  categories={categories
                    .filter(
                      (category, index, self) =>
                        index === self.findIndex((c) => c.name === category.name),
                    )
                    .slice(0, 5)}
                  compact
                />
              ) : (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              )}
              <div className="text-center py-3 border-t border-border/20">
                <p className="text-xs text-muted-foreground">
                  Storefront preview updates live. The homepage (/) updates when you Save Changes.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
            <div className="text-sm font-medium text-foreground">Category layout</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Shop by category section on the landing page.
            </p>
            <div className="mt-4 space-y-2">
              {[
                {
                  name: CATEGORY_LAYOUTS[0],
                  icon: LayoutGrid,
                  description: "Grid-based category cards",
                },
                {
                  name: CATEGORY_LAYOUTS[1],
                  icon: GalleryThumbnails,
                  description: "Horizontal category carousel",
                },
                {
                  name: CATEGORY_LAYOUTS[2],
                  icon: Layers,
                  description: "Full-width category rows",
                },
              ].map(({ name, icon: Icon, description }) => (
                <button
                  key={name}
                  onClick={() => updateContent({ layout: name }, { immediatePreview: true })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    isClient && content.layout === name
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isClient && content.layout === name ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1">
                    <span
                      className={`text-sm ${
                        isClient && content.layout === name
                          ? "text-primary font-medium"
                          : "text-foreground"
                      }`}
                    >
                      {name}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                  {isClient && content.layout === name && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Current:{" "}
                <span className="text-primary font-medium">
                  {isClient ? content.layout : "Loading…"}
                </span>
              </p>
              <Button
                size="sm"
                onClick={saveAllChanges}
                disabled={saving}
                className="rounded-full px-4 bg-primary hover:bg-primary/90"
              >
                {saving ? "Saving..." : "Save Layout"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
            <div className="text-sm font-medium text-foreground">Animation template</div>
            <p className="mt-1 text-xs text-muted-foreground">
              A coordinated motion style — page transitions, hero choreography, scroll reveals, and
              hover interactions — applied across the storefront.
            </p>
            <div className="mt-4 space-y-2">
              {ANIMATION_TEMPLATES.map(({ id, label, description, layers }) => {
                const active = isClient && content.animationTemplate === id;
                return (
                  <button
                    key={id}
                    onClick={() =>
                      updateContent({ animationTemplate: id }, { immediatePreview: true })
                    }
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
                      active ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                    }`}
                  >
                    <Sparkles
                      className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="flex-1">
                      <span
                        className={`text-sm ${active ? "text-primary font-medium" : "text-foreground"}`}
                      >
                        {label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      {layers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {layers.map((layer) => (
                            <span
                              key={layer}
                              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {layer}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Current:{" "}
                <span className="text-primary font-medium">
                  {isClient
                    ? (ANIMATION_TEMPLATES.find((a) => a.id === content.animationTemplate)?.label ??
                      "Cinematic (recommended)")
                    : "Loading…"}
                </span>
              </p>
              <Button
                size="sm"
                onClick={saveAllChanges}
                disabled={saving}
                className="rounded-full px-4 bg-primary hover:bg-primary/90"
              >
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
            <div className="text-sm font-medium text-foreground">Background animation</div>
            <p className="mt-1 text-xs text-muted-foreground">
              An animated decorative backdrop behind the hero.
            </p>
            <div className="mt-4 space-y-2">
              {BACKGROUND_ANIMATIONS.map(({ id, label, description }) => {
                const active = isClient && content.backgroundAnimation === id;
                return (
                  <button
                    key={id}
                    onClick={() =>
                      updateContent({ backgroundAnimation: id }, { immediatePreview: true })
                    }
                    className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors ${
                      active ? "border border-primary/20 bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  >
                    <Sparkles
                      className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="flex-1">
                      <span
                        className={`text-sm ${active ? "font-medium text-primary" : "text-foreground"}`}
                      >
                        {label}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                    </div>
                    {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-4">
              <p className="text-xs text-muted-foreground">
                Current:{" "}
                <span className="font-medium text-primary">
                  {isClient
                    ? (BACKGROUND_ANIMATIONS.find((a) => a.id === content.backgroundAnimation)
                        ?.label ?? "Floating orbs")
                    : "Loading…"}
                </span>
              </p>
              <Button
                size="sm"
                onClick={saveAllChanges}
                disabled={saving}
                className="rounded-full bg-primary px-4 hover:bg-primary/90"
              >
                {saving ? "Saving..." : "Save Background"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">Craft story section</div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={content.craftStory?.isActive ?? true}
                  onChange={(e) =>
                    updateContent(
                      { craftStory: { ...content.craftStory, isActive: e.target.checked } },
                      { immediatePreview: true },
                    )
                  }
                />
                Show on landing
              </label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              The editorial “why we're different” block on the homepage.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Eyebrow</label>
                <input
                  value={content.craftStory?.eyebrow ?? ""}
                  onChange={(e) =>
                    updateContent(
                      { craftStory: { ...content.craftStory, eyebrow: e.target.value } },
                      { immediatePreview: true },
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Headline (use a new line to split)
                </label>
                <textarea
                  value={content.craftStory?.headline ?? ""}
                  onChange={(e) =>
                    updateContent(
                      { craftStory: { ...content.craftStory, headline: e.target.value } },
                      { immediatePreview: true },
                    )
                  }
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              {(content.craftStory?.chapters ?? []).map((chapter, idx) => (
                <div key={idx} className="rounded-xl border border-border/60 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Chapter {idx + 1}
                  </span>
                  <input
                    value={chapter.title}
                    placeholder="Title"
                    onChange={(e) =>
                      updateContent(
                        {
                          craftStory: {
                            ...content.craftStory,
                            chapters: content.craftStory.chapters.map((c, i) =>
                              i === idx ? { ...c, title: e.target.value } : c,
                            ),
                          },
                        },
                        { immediatePreview: true },
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <textarea
                    value={chapter.body}
                    placeholder="Description"
                    rows={2}
                    onChange={(e) =>
                      updateContent(
                        {
                          craftStory: {
                            ...content.craftStory,
                            chapters: content.craftStory.chapters.map((c, i) =>
                              i === idx ? { ...c, body: e.target.value } : c,
                            ),
                          },
                        },
                        { immediatePreview: true },
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end border-t border-border/20 pt-4">
              <Button
                size="sm"
                onClick={saveAllChanges}
                disabled={saving}
                className="rounded-full bg-primary px-4 hover:bg-primary/90"
              >
                {saving ? "Saving..." : "Save Story"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-primary-soft/40 p-6">
            <div className="font-serif text-xl italic text-primary">Designer's Tip</div>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
              "For a high-end feel, ensure your hero images have at least 60% negative space. This
              allows the typography to remain legible while maintaining the airy aesthetic."
            </p>
            <a className="mt-4 inline-block text-sm text-primary font-medium">Read Style Guide →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
