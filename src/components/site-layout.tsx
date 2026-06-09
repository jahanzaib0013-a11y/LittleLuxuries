import { Link } from "@tanstack/react-router";
import { ShoppingBag, Heart, Menu, Loader2, CheckCircle2, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/hooks/use-favorites";
import { CartSidebar } from "@/components/cart-sidebar";
import { storeUTMParameters } from "@/lib/utils";
import { useStoreSettingsContext } from "@/context/StoreSettingsContext";
import { useCategories } from "@/hooks/use-categories";
import { usePublishedProducts } from "@/lib/product-queries";
import { subscribeToNewsletter } from "@/lib/email.server";
import { validateEmail } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/page-transition";
// Lazy wrappers: defer the heavy motion/lenis libraries until after first paint
// (keeps the full experience, keeps them out of the main entry chunk).
import { SmoothScroll, CustomCursor } from "@/components/motion/lazy-motion";
import { Toaster } from "@/components/ui/sonner";
import {
  loadPublishedContent,
  SITE_CONTENT_PUBLISHED_UPDATED_EVENT,
  type AnimationTemplate,
} from "@/lib/content-data";

const stickyPromoPad = "pb-28 sm:pb-32";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/blog", label: "Journal" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { getCartCount, isCartOpen, openCart, closeCart } = useCart();
  const { favorites } = useFavorites();
  const { settings } = useStoreSettingsContext();
  const cartCount = getCartCount();
  const favCount = favorites.length;

  const storeName = settings?.store_name || "Little Luxuries";

  // Initialize UTM tracking on every page load
  useEffect(() => {
    storeUTMParameters();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background">
              <SheetTitle className="font-serif text-2xl italic text-primary">
                {storeName}
              </SheetTitle>
              <nav className="mt-8 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted hover:text-primary data-[status=active]:bg-primary-soft data-[status=active]:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/favorites"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted hover:text-primary data-[status=active]:bg-primary-soft data-[status=active]:text-primary"
                >
                  Favorites
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <span className="font-serif text-xl sm:text-2xl italic text-primary truncate">
              {storeName}
            </span>
          </Link>
        </div>

        <nav className="hidden min-w-0 items-center gap-4 md:gap-6 lg:flex lg:gap-8 xl:gap-10">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="group relative shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary data-[status=active]:text-primary lg:text-[12px] lg:tracking-[0.18em]"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-gold transition-all duration-300 group-hover:w-6 group-data-[status=active]:w-6" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/favorites"
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary md:inline-flex"
            aria-label="Wishlist"
          >
            <Heart className="size-4" />
            {favCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {favCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-soft"
            aria-label="Cart"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer({ className }: { className?: string }) {
  const { settings } = useStoreSettingsContext();
  const { categories } = useCategories();
  const { data: footerProducts = [] } = usePublishedProducts();
  const storeName = settings?.store_name || "Little Luxuries";
  const currentYear = new Date().getFullYear();
  const categoryProductNames = new Set(footerProducts.map((p) => p.category));
  const shopCategories = categories
    .filter((c, i, self) => i === self.findIndex((x) => x.name === c.name))
    .filter((c) => categoryProductNames.has(c.name))
    .slice(0, 4);
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

  return (
    <footer className={cn("mt-24 border-t border-border/60 bg-secondary/40", className)}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={logo} alt={storeName} width={80} height={80} className="mb-3" />
          <p className="font-serif text-xl italic text-primary">{storeName}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Crafting heirloom-quality baby garments with a commitment to ethics, comfort, and
            timeless luxury.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://www.facebook.com/share/1B8qfP9LFc/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Facebook"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href="https://www.instagram.com/littleluxuries__pk?igsh=MTA2NDE0dGZlNmg1Yg%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Instagram"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="https://pin.it/2x5S34WVB"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Pinterest"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.993 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.378-.293 1.194-.333 1.361-.052.22-.174.266-.402.16-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.608 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12C24 5.372 18.627 0 12 0z" />
              </svg>
            </a>
          </div>
        </div>
        <div>
          <h4 className="label-eyebrow mb-4">Shop</h4>
          <ul className="space-y-2.5">
            <li>
              <Link
                to="/shop"
                search={{ badge: "New" }}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                New Arrivals
              </Link>
            </li>
            {shopCategories.map((c) => (
              <li key={c.id}>
                <Link
                  to="/shop"
                  search={{ category: c.name }}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <FooterCol
          title="Care"
          links={[
            { label: "Journal", to: "/blog" },
            { label: "Contact", to: "/contact" },
            { label: "Shipping", to: "/contact" },
            { label: "Our Story", to: "/about" },
          ]}
        />
        <div>
          <h4 className="label-eyebrow mb-4">Newsletter</h4>
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-4 text-center animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="size-6 text-green-500 mb-2" />
              <p className="text-sm font-medium text-foreground">You're in the Circle.</p>
              <p className="text-xs text-muted-foreground mt-1">Check your inbox for your gift.</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Join our circle for early access to new collections and gentle inspiration.
              </p>
              <form className="flex flex-col gap-2" onSubmit={handleSubscribe} noValidate>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(undefined);
                    }}
                    placeholder="your@email.com"
                    aria-invalid={Boolean(emailError)}
                    className={cn(
                      "flex-1 rounded-full border bg-card px-4 py-2 text-sm outline-none transition-colors focus:border-primary",
                      emailError ? "border-destructive" : "border-border",
                    )}
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full sm:w-auto sm:min-w-[70px] flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
                  >
                    {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : "Join"}
                  </button>
                </div>
                {emailError && (
                  <p className="text-xs text-destructive" role="alert">
                    {emailError}
                  </p>
                )}
              </form>
              {status === "error" && !emailError && (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  Something went wrong. Please try again.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="border-t border-border/60 px-6 py-6 text-center text-xs text-muted-foreground">
        © {currentYear} {storeName}. Ethically made with love. ·{" "}
        <Link to="/login" className="hover:text-primary">
          Admin
        </Link>
      </div>
    </footer>
  );
}

/**
 * Active motion template for the storefront shell. Starts at the SSR-safe
 * default and syncs from the published content (localStorage) on mount, then
 * tracks publish events so the page-transition look stays in step with Content.
 */
function useAnimationTemplate(): AnimationTemplate {
  const [template, setTemplate] = useState<AnimationTemplate>("couture");
  useEffect(() => {
    const sync = () => setTemplate(loadPublishedContent().animationTemplate ?? "couture");
    sync();
    window.addEventListener(SITE_CONTENT_PUBLISHED_UPDATED_EVENT, sync);
    return () => window.removeEventListener(SITE_CONTENT_PUBLISHED_UPDATED_EVENT, sync);
  }, []);
  return template;
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="label-eyebrow mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Layout({
  children,
  beforeHeader,
  padForStickyPromo,
}: {
  children: React.ReactNode;
  /** Renders above the site header (e.g. homepage promo strip). */
  beforeHeader?: React.ReactNode;
  /** Extra bottom padding so sticky promo + footer are not covered. */
  padForStickyPromo?: boolean;
}) {
  const { isCartOpen, closeCart } = useCart();
  const pad = padForStickyPromo ? stickyPromoPad : undefined;
  const animationTemplate = useAnimationTemplate();
  return (
    <SmoothScroll template={animationTemplate}>
      {/* Intro curtain removed: the instant brand splash in __root now covers
          the load moment (it shows before JS, the curtain only after), so
          running both caused a stutter on the homepage first open. */}
      <CustomCursor template={animationTemplate} />
      <div className="flex min-h-screen flex-col" data-anim-template={animationTemplate}>
        {beforeHeader}
        <Header />
        <main className={cn("flex-1", pad)}>
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer className={pad} />
        <CartSidebar isOpen={isCartOpen} onOpenChange={closeCart} />
      </div>
      <Toaster />
    </SmoothScroll>
  );
}
