import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

export function Header() {
  const navItems = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl italic text-primary">Little Luxuries</span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="group relative text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary data-[status=active]:text-primary"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-gold transition-all duration-300 group-hover:w-6 group-data-[status=active]:w-6" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button className="hidden rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary md:inline-flex" aria-label="Search">
            <Search className="size-4" />
          </button>
          <button className="hidden rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary md:inline-flex" aria-label="Wishlist">
            <Heart className="size-4" />
          </button>
          <Link
            to="/checkout"
            className="relative rounded-full p-2.5 text-primary transition-colors hover:bg-primary-soft"
            aria-label="Cart"
          >
            <ShoppingBag className="size-5" />
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">
              2
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <img src={logo} alt="Little Luxuries" width={80} height={80} className="mb-3" />
          <p className="font-serif text-xl italic text-primary">Little Luxuries</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Crafting heirloom-quality baby garments with a commitment to ethics, comfort, and timeless luxury.
          </p>
        </div>
        <FooterCol
          title="Shop"
          links={[
            { label: "New Arrivals", to: "/shop" },
            { label: "Onesies", to: "/shop" },
            { label: "Sleepwear", to: "/shop" },
            { label: "Gift Sets", to: "/shop" },
          ]}
        />
        <FooterCol
          title="Care"
          links={[
            { label: "Contact", to: "/contact" },
            { label: "Shipping", to: "/contact" },
            { label: "Returns", to: "/contact" },
            { label: "Our Story", to: "/about" },
          ]}
        />
        <div>
          <h4 className="label-eyebrow mb-4">Newsletter</h4>
          <p className="mb-3 text-sm text-muted-foreground">
            Join our circle for early access to new collections and gentle inspiration.
          </p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Join
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-border/60 px-6 py-6 text-center text-xs text-muted-foreground">
        © 2026 Little Luxuries Baby Garments. Ethically made with love.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="label-eyebrow mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
