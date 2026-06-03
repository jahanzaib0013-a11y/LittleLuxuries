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
import { loadContent, saveContent, SiteContent } from "@/lib/content-data";
import { products } from "@/lib/products";
import { formatPkr } from "@/lib/format-currency";
import hero from "@/assets/hero-baby.jpg";

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

function ContentPage() {
  const [content, setContent] = useState<SiteContent>(loadContent());
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [heroImage, setHeroImage] = useState<string>(hero);
  const [editingBadge, setEditingBadge] = useState(false);
  const [iconSelector, setIconSelector] = useState<{
    promiseIndex: number | null;
    isOpen: boolean;
  }>({ promiseIndex: null, isOpen: false });
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 140; // Width of one card + gap
      if (direction === "left") {
        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    const savedContent = loadContent();
    setContent(savedContent);
  }, []);

  // Ensure content state is always fresh
  useEffect(() => {
    const handleStorageChange = () => {
      const savedContent = loadContent();
      setContent(savedContent);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateContent = (updates: Partial<SiteContent>) => {
    console.log("📝 updateContent called with:", updates);
    setContent((prev) => {
      const newContent = { ...prev, ...updates };
      console.log("🔄 New content state:", newContent);
      // Save immediately for layout changes
      if ("layout" in updates) {
        console.log("💾 Saving layout change:", updates.layout);
        saveContent(newContent);
        console.log("✅ Layout saved to localStorage");
      }
      return newContent;
    });
    setHasChanges(true);
    // Reset hasChanges immediately for layout since we saved
    if ("layout" in updates) {
      setHasChanges(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImage(reader.result as string);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const availableIcons = [
    { name: "Leaf", icon: Leaf },
    { name: "Award", icon: Award },
    { name: "Heart", icon: Heart },
    { name: "Shield", icon: Shield },
    { name: "Sparkles", icon: Sparkles },
    { name: "Gem", icon: Gem },
    { name: "Cloud", icon: Cloud },
    { name: "Sun", icon: Sun },
    { name: "Moon", icon: Moon },
    { name: "Flower", icon: Flower },
    { name: "Trees", icon: Trees },
    { name: "Droplet", icon: Droplet },
    { name: "Wind", icon: Wind },
    { name: "Flame", icon: Flame },
    { name: "Zap", icon: Zap },
    { name: "Package", icon: Package },
    { name: "Truck", icon: Truck },
    { name: "RefreshCw", icon: RefreshCw },
    { name: "Clock", icon: Clock },
    { name: "Calendar", icon: Calendar },
    { name: "MapPin", icon: MapPin },
    { name: "Phone", icon: Phone },
    { name: "Mail", icon: Mail },
    { name: "Globe", icon: Globe },
    { name: "Users", icon: Users },
    { name: "Building", icon: Building },
    { name: "Home", icon: Home },
    { name: "ShoppingBag", icon: ShoppingBag },
    { name: "CreditCard", icon: CreditCard },
    { name: "Tag", icon: Tag },
    { name: "Percent", icon: Percent },
    { name: "Gift", icon: Gift },
    { name: "Bell", icon: Bell },
    { name: "AlertCircle", icon: AlertCircle },
    { name: "CheckCircle", icon: CheckCircle },
    { name: "Info", icon: Info },
    { name: "HelpCircle", icon: HelpCircle },
    { name: "TrendingUp", icon: TrendingUp },
    { name: "Target", icon: Target },
  ];

  const updatePromiseIcon = (promiseIndex: number, iconName: string) => {
    const iconMap: { [key: string]: any } = {};
    availableIcons.forEach(({ name, icon }) => {
      iconMap[name] = icon;
    });

    const newPromises = [...content.announcementBar.promises];
    // Store icon name instead of icon component
    newPromises[promiseIndex] = { ...newPromises[promiseIndex], iconName };
    updateContent({ announcementBar: { ...content.announcementBar, promises: newPromises } });
    setIconSelector({ promiseIndex: null, isOpen: false });
  };

  const getPromiseIcon = (promise: any, index: number) => {
    if (promise.iconName) {
      const foundIcon = availableIcons.find(({ name }) => name === promise.iconName);
      return foundIcon ? foundIcon.icon : [Leaf, Award, Heart][index % 3];
    }
    return [Leaf, Award, Heart][index % 3];
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      saveContent(content);
      setHasChanges(false);
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to save content:", error);
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
          Curate the boutique experience with high-end visuals and targeted announcements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hero banner card */}
          <div className="rounded-2xl bg-card p-7 shadow-(--shadow-card)">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Primary Hero Banner</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Visible on mobile and desktop storefronts.
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
                  <div className="mt-5 font-serif text-5xl leading-[1.05] text-foreground md:text-6xl lg:text-7xl whitespace-pre max-w-full h-[3.5em] md:h-[3.2em] lg:h-[3em] overflow-hidden">
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
                  <div className="mt-12 flex items-center gap-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="size-3.5 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Loved by 12,000+ families worldwide
                    </p>
                  </div>
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
                            onChange={(e) =>
                              updateContent({
                                heroBanner: { ...content.heroBanner, badgeTitle: e.target.value },
                              })
                            }
                            className="text-xs font-semibold uppercase tracking-wider text-primary bg-transparent border-b border-primary/30 outline-none w-36"
                            onKeyDown={(e) => e.key === "Enter" && setEditingBadge(false)}
                            autoFocus
                          />
                          <input
                            type="text"
                            value={content.heroBanner.badgeSubtitle}
                            onChange={(e) =>
                              updateContent({
                                heroBanner: {
                                  ...content.heroBanner,
                                  badgeSubtitle: e.target.value,
                                },
                              })
                            }
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
                  Banner Headline
                </Label>
                <Textarea
                  value={content.heroBanner.headline}
                  onChange={(e) => {
                    if (e.target.value.length <= 36) {
                      updateContent({
                        heroBanner: { ...content.heroBanner, headline: e.target.value },
                      });
                    }
                  }}
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl resize-none"
                  placeholder="Enter headline with newline for second line..."
                  maxLength={36}
                />
                <div className="mt-1 text-xs text-muted-foreground text-right">
                  {content.heroBanner.headline.length}/36 characters
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Input
                  value={content.heroBanner.description}
                  onChange={(e) =>
                    updateContent({
                      heroBanner: { ...content.heroBanner, description: e.target.value },
                    })
                  }
                  className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Badge Title
                  </Label>
                  <Input
                    value={content.heroBanner.badgeTitle}
                    onChange={(e) =>
                      updateContent({
                        heroBanner: { ...content.heroBanner, badgeTitle: e.target.value },
                      })
                    }
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Badge Subtitle
                  </Label>
                  <Input
                    value={content.heroBanner.badgeSubtitle}
                    onChange={(e) =>
                      updateContent({
                        heroBanner: { ...content.heroBanner, badgeSubtitle: e.target.value },
                      })
                    }
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
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
                    onChange={(e) =>
                      updateContent({
                        heroBanner: { ...content.heroBanner, buttonLabel: e.target.value },
                      })
                    }
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Button Link (URL)
                  </Label>
                  <Input
                    value={content.heroBanner.buttonLink}
                    onChange={(e) =>
                      updateContent({
                        heroBanner: { ...content.heroBanner, buttonLink: e.target.value },
                      })
                    }
                    className="mt-2 h-12 bg-muted/40 border-0 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Promises Section */}
          <div className="rounded-2xl bg-card p-7 shadow-(--shadow-card)">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-2xl text-foreground">Brand Promises</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Live Status:</span>
                <button
                  onClick={() =>
                    updateContent({
                      announcementBar: {
                        ...content.announcementBar,
                        isActive: !content.announcementBar.isActive,
                      },
                    })
                  }
                  className={`h-6 w-11 rounded-full relative transition-colors ${
                    content.announcementBar.isActive ? "bg-gold" : "bg-muted-foreground/30"
                  }`}
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
                          onClick={() => setIconSelector({ promiseIndex: index, isOpen: true })}
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
                        onClick={() => setIconSelector({ promiseIndex: index, isOpen: true })}
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
                          onChange={(e) => {
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
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Description
                        </Label>
                        <Input
                          value={promise.description}
                          onChange={(e) => {
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Icon Selector Modal */}
            {iconSelector.isOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-xl text-foreground">Choose Icon</h3>
                    <button
                      onClick={() => setIconSelector({ promiseIndex: null, isOpen: false })}
                      className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                    {availableIcons.map(({ name, icon: Icon }) => (
                      <button
                        key={name}
                        onClick={() =>
                          iconSelector.promiseIndex !== null &&
                          updatePromiseIcon(iconSelector.promiseIndex, name)
                        }
                        className="h-12 w-12 rounded-full bg-muted/40 hover:bg-primary/10 flex items-center justify-center transition-colors group"
                        title={name}
                      >
                        <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Product Preview Cards */}
          <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
            <div className="flex items-center gap-2 text-sm mb-4">
              <Eye className="h-4 w-4 text-primary" /> Product Preview
            </div>
            <div className="space-y-4">
              {/* Dynamic Product Layout Display */}
              {isClient && content.layout === "Editorial Grid" && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground text-center">
                    Editorial Grid Layout
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 4).map((product, index) => (
                      <div
                        key={product.id}
                        className="rounded-lg overflow-hidden border border-border/20"
                      >
                        <div className="aspect-square bg-card overflow-hidden">
                          <img
                            src={product.image_url || product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-foreground">{product.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{product.variant}</p>
                          <p className="text-sm font-medium text-primary mt-2">
                            {formatPkr(Number(product.price))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isClient && content.layout === "Minimal Carousel" && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground text-center">
                    Minimal Carousel Layout
                  </div>
                  <div className="relative">
                    <div
                      className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar"
                      ref={carouselRef}
                    >
                      {products.slice(0, 4).map((product) => (
                        <div
                          key={product.id}
                          className="flex-none w-32 rounded-lg overflow-hidden border border-border/20"
                        >
                          <div className="aspect-square bg-card overflow-hidden">
                            <img
                              src={product.image_url || product.image}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                          <div className="p-2">
                            <h4 className="text-xs font-medium text-foreground truncate">
                              {product.name}
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                              {product.variant}
                            </p>
                            <p className="text-xs font-medium text-primary mt-1">
                              {formatPkr(Number(product.price))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => scrollCarousel("left")}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 h-6 w-6 rounded-full bg-card shadow-md flex items-center justify-center text-xs hover:bg-muted transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => scrollCarousel("right")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 h-6 w-6 rounded-full bg-card shadow-md flex items-center justify-center text-xs hover:bg-muted transition-colors"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}

              {isClient && content.layout === "Full Width Stacks" && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground text-center">
                    Full Width Stacks Layout
                  </div>
                  <div className="space-y-3">
                    {products.slice(0, 2).map((product, index) => (
                      <div
                        key={product.id}
                        className="grid grid-cols-2 gap-3 items-center rounded-lg border border-border/20 p-3"
                      >
                        <div className={index % 2 === 0 ? "order-2" : ""}>
                          <div className="aspect-square bg-card overflow-hidden rounded">
                            <img
                              src={product.image_url || product.image}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                        </div>
                        <div className={index % 2 === 0 ? "order-1" : ""}>
                          <h4 className="text-sm font-medium text-foreground">{product.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.description}
                          </p>
                          <p className="text-sm font-medium text-primary mt-2">
                            {formatPkr(Number(product.price))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Layout Preview Note */}
              <div className="text-center py-3 border-t border-border/20">
                <p className="text-xs text-muted-foreground">Click layouts below to see preview</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-(--shadow-card)">
            <div className="text-sm font-medium text-foreground">Layout Configuration</div>
            <div className="mt-4 space-y-2">
              {[
                {
                  name: "Editorial Grid",
                  icon: LayoutGrid,
                  description: "Grid-based product layout",
                },
                {
                  name: "Minimal Carousel",
                  icon: GalleryThumbnails,
                  description: "Sliding product showcase",
                },
                {
                  name: "Full Width Stacks",
                  icon: Layers,
                  description: "Full-width product sections",
                },
              ].map(({ name, icon: Icon, description }) => (
                <button
                  key={name}
                  onClick={() => updateContent({ layout: name })}
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
            <div className="mt-4 pt-4 border-t border-border/20">
              <p className="text-xs text-muted-foreground">
                Current:{" "}
                <span className="text-primary font-medium">
                  {isClient ? content.layout : "Loading..."}
                </span>
              </p>
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
