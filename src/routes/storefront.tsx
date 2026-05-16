import { createFileRoute } from "@tanstack/react-router";
import { loadContent, SiteContent } from "@/lib/content-data";
import { useState, useEffect, useRef } from "react";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero-baby.jpg";
import {
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, Menu, X, ArrowRight, Smile, Star } from "lucide-react";
import { products } from "@/lib/products";
import { formatPkr } from "@/lib/format-currency";

export const Route = createFileRoute("/storefront")({
  head: () => ({ meta: [{ title: "Little Luxuries — Premium Baby Garments" }] }),
  component: StorefrontPage,
});

function Promise({ icon: Icon, title, body }: { icon: typeof Leaf; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-card shadow-(--shadow-card)">
        <Icon className="size-6 text-primary" />
      </div>
      <h3 className="mt-5 font-serif text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function StorefrontPage() {
  const [content, setContent] = useState(loadContent());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const lastLayoutRef = useRef(content.layout);

  // Prevent hydration mismatch by only rendering after client-side mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Log initial content
  console.log("🏪 Storefront loaded with content:", content);
  console.log("📐 Current layout:", content.layout);

  useEffect(() => {
    let pollCount = 0;

    const handleStorageChange = () => {
      pollCount++;
      const newContent = loadContent();
      console.log(
        "🔍 Poll check #" + pollCount + " - current:",
        lastLayoutRef.current,
        "stored:",
        newContent.layout,
      );

      if (newContent.layout !== lastLayoutRef.current) {
        console.log("✅ CHANGE DETECTED:", lastLayoutRef.current, "→", newContent.layout);
        setIsSyncing(true);
        lastLayoutRef.current = newContent.layout;
        setContent(newContent);
        setTimeout(() => setIsSyncing(false), 300);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Aggressive polling: check every 100ms
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Promises Section */}
      {content.announcementBar.isActive && (
        <div className="bg-primary-soft/40 border-b border-border/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content.announcementBar.promises.map((promise, index) => {
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

                const getPromiseIcon = (promise: any, index: number) => {
                  if (promise.iconName) {
                    const foundIcon = availableIcons.find(({ name }) => name === promise.iconName);
                    return foundIcon ? foundIcon.icon : [Leaf, Award, Heart][index % 3];
                  }
                  return [Leaf, Award, Heart][index % 3];
                };

                const Icon = getPromiseIcon(promise, index);
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl text-primary mb-3">{promise.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      {promise.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-border/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Little Luxuries"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <div className="font-serif text-lg text-primary italic">Little Luxuries</div>
                <div className="text-[10px] tracking-[0.15em] text-muted-foreground">
                  BABY GARMENTS
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#"
                className="text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                Shop
              </a>
              <a
                href="#"
                className="text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                Collections
              </a>
              <a
                href="#"
                className="text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                Contact
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Search className="h-4 w-4" />
                Search
              </button>
              <button className="relative h-10 w-10 grid place-items-center rounded-full bg-primary-soft hover:bg-primary/20 transition-colors">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden h-10 w-10 grid place-items-center rounded-full bg-muted hover:bg-muted/80"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/60 py-4">
              <nav className="flex flex-col gap-4">
                <a
                  href="#"
                  className="text-sm text-foreground/70 hover:text-primary transition-colors"
                >
                  Shop
                </a>
                <a
                  href="#"
                  className="text-sm text-foreground/70 hover:text-primary transition-colors"
                >
                  Collections
                </a>
                <a
                  href="#"
                  className="text-sm text-foreground/70 hover:text-primary transition-colors"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-sm text-foreground/70 hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* HERO - Matching index.tsx */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="relative z-10">
            <span className="label-eyebrow">{content.heroBanner.seasonTag}</span>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-foreground md:text-6xl lg:text-7xl">
              {content.heroBanner.headline.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                  {i === 1 && <em className="text-primary">{line}</em>}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Thoughtfully designed garments that embrace your baby in softest ethically-sourced
              materials. Timeless elegance for modern nursery.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                onClick={() => window.open(content.heroBanner.buttonLink, "_blank")}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {content.heroBanner.buttonLabel}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Explore Our Story
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Loved by 12,000+ families worldwide</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-linear-to-br from-lilac/40 via-blush/30 to-gold/20 blur-2xl" />
            <div className="relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-(--shadow-soft)">
              <img
                src={hero}
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
                    Hand-crafted
                  </p>
                  <p className="text-sm text-muted-foreground">In small artisan batches</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO MARK */}
      <section className="bg-background py-16">
        <div className="mx-auto flex max-w-md flex-col items-center px-6 text-center">
          <img src={logo} alt="Little Luxuries" width={140} height={140} />
          <div className="divider-ornament mt-2 w-full">
            <span className="diamond" />
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          <Promise
            icon={Leaf}
            title="Ethically Made"
            body="Responsibly sourced and sustainably produced with love for planet."
          />
          <Promise
            icon={Award}
            title="Heirloom Quality"
            body="Standards of craftsmanship designed to last through generations."
          />
          <Promise
            icon={Smile}
            title="Soft on Skin"
            body="Hypoallergenic and ultra-soft fabrics for most sensitive skin."
          />
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-secondary/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <span className="label-eyebrow">Just Arrived</span>
            <h2 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">
              New for your little one
            </h2>
            {!isClient ? (
              <div className="mt-4 text-sm text-muted-foreground">Loading layout...</div>
            ) : (
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                  <span className="text-sm font-medium text-primary">Active Layout:</span>
                  <span className="text-sm text-primary font-bold">{content.layout}</span>
                </div>
                {isSyncing && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium animate-pulse">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Syncing...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Editorial Grid Layout */}
          {isClient && content.layout === "Editorial Grid" && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 4).map((product, index) => (
                <div
                  key={index}
                  className="group bg-card rounded-2xl overflow-hidden shadow-(--shadow-card) hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-card">
                    {product.badge && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                        {product.badge}
                      </span>
                    )}
                    <img
                      src={product.image_url || product.image}
                      alt={product.name}
                      loading="lazy"
                      width={1024}
                      height={1024}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">
                      {product.name}
                    </h3>
                    <span className="font-medium text-primary">
                      {formatPkr(Number(product.price))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{product.variant}</p>
                </div>
              ))}
            </div>
          )}

          {/* Minimal Carousel Layout */}
          {isClient && content.layout === "Minimal Carousel" && (
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {products.slice(0, 4).map((product, index) => (
                  <div
                    key={index}
                    className="flex-none w-80 group bg-card rounded-2xl overflow-hidden shadow-(--shadow-card) hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-card">
                      {product.badge && (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                          {product.badge}
                        </span>
                      )}
                      <img
                        src={product.image_url || product.image}
                        alt={product.name}
                        loading="lazy"
                        width={1024}
                        height={1024}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-xl text-foreground transition-colors group-hover:text-primary mb-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">{product.variant}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-primary text-lg">
                          {formatPkr(Number(product.price))}
                        </span>
                        <Button className="rounded-full">View Details</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full bg-card shadow-lg flex items-center justify-center">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full bg-card shadow-lg flex items-center justify-center">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Full Width Stacks Layout */}
          {isClient && content.layout === "Full Width Stacks" && (
            <div className="space-y-12">
              {products.slice(0, 4).map((product, index) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={index % 2 === 1 ? "order-2 lg:order-1" : ""}>
                    <div className="relative aspect-square overflow-hidden rounded-3xl bg-card shadow-(--shadow-card)">
                      {product.badge && (
                        <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                          {product.badge}
                        </span>
                      )}
                      <img
                        src={product.image_url || product.image}
                        alt={product.name}
                        loading="lazy"
                        width={1024}
                        height={1024}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? "order-1 lg:order-2" : ""}>
                    <span className="label-eyebrow">Featured Item</span>
                    <h3 className="mt-3 font-serif text-3xl text-foreground lg:text-4xl">
                      {product.name}
                    </h3>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                      {product.variant}
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                      <span className="font-serif text-2xl text-primary">
                        {formatPkr(Number(product.price))}
                      </span>
                      <Button className="rounded-full px-8">Shop Now</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-14 text-center md:px-16 md:py-20"
          style={{ background: "var(--gradient-soft)" }}
        >
          <div className="relative z-10 mx-auto max-w-xl">
            <span className="label-eyebrow">Join Circle</span>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Receive early access to new collections
            </h2>
            <p className="mt-3 text-muted-foreground">
              Subscribe for parenting inspiration and exclusive offers, delivered with care.
            </p>
            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none transition-colors focus:border-primary"
              />
              <Button className="rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/60 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logo}
                  alt="Little Luxuries"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="font-serif text-lg text-primary italic">Little Luxuries</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Premium baby garments crafted with love and organic materials for little ones who
                deserve best.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Shop</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  All Products
                </a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  New Arrivals
                </a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Best Sellers
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Customer Care</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Contact Us
                </a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Shipping Info
                </a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Returns
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Connect</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Instagram
                </a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Facebook
                </a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Newsletter
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border/60 mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Little Luxuries. All rights reserved. Made with ❤️ for little ones.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
