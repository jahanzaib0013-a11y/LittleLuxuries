import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid, ShoppingBag, Receipt, Users, Tag, FileEdit,
  BarChart3, Settings, Bell, Search, LogOut,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { adminUser } from "@/lib/admin-data";
import { Input } from "@/components/ui/input";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/coupons", label: "Coupons", icon: Tag },
  { to: "/content", label: "Content", icon: FileEdit },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AdminLayout({
  searchPlaceholder = "Search…",
  rightSlot,
  children,
}: {
  searchPlaceholder?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-[oklch(0.97_0.005_300)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-card border-r border-border">
        <div className="px-6 py-6 flex items-center gap-3">
          <img src={logo} alt="Little Luxuries" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <div className="font-serif text-lg leading-tight text-primary italic">Little Luxuries</div>
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground">BABY GARMENTS</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl bg-muted/60 p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 grid place-items-center text-primary text-xs font-semibold">
            {adminUser.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{adminUser.name}</div>
            <div className="text-xs text-muted-foreground truncate">{adminUser.role}</div>
          </div>
          <Link to="/login" className="text-muted-foreground hover:text-primary">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-[oklch(0.97_0.005_300)]/90 backdrop-blur border-b border-border/60">
          <div className="flex items-center gap-4 px-6 lg:px-10 py-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-11 h-11 rounded-full bg-card border-border"
              />
            </div>
            <div className="flex items-center gap-3">
              {rightSlot}
              <button className="relative h-10 w-10 grid place-items-center rounded-full bg-card border border-border hover:bg-muted">
                <Bell className="h-4 w-4 text-foreground/70" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 lg:px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
