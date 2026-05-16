import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutGrid,
  ShoppingBag,
  Receipt,
  Users,
  Tag,
  FileEdit,
  BarChart3,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  ChevronDown,
  MessageSquare,
  Crown,
  MessageCircle,
  Zap,
  Trophy,
  Eye,
  ShoppingCart,
  CheckCircle,
  User,
  Loader2,
  Target as TargetIcon,
  Award,
  Star,
  Package,
  CreditCard,
  AlertCircle,
  BellOff,
  Share2,
  Smartphone,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { adminUser } from "@/lib/admin-data";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/lib/order-service";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/customers", label: "Customers", icon: Users },
  // { to: "/inbox", label: "Social Inbox", icon: MessageSquare },
  { to: "/coupons", label: "Coupons", icon: Tag },
  { to: "/content", label: "Content", icon: FileEdit },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { settings: adminSettings } = useAdminSettings();
  const displayName = adminSettings?.admin_name || adminUser.name;
  const displayRole = adminSettings?.admin_role || adminUser.role;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("");

  return (
    <div className="flex h-screen flex-col">
      <div className="px-4 py-4 flex items-center gap-3 shrink-0">
        <img src={logo} alt="Little Luxuries" className="h-9 w-9 rounded-full object-cover" />
        <div>
          <div className="font-serif text-base leading-tight text-primary italic">
            Little Luxuries
          </div>
          <div className="text-[9px] tracking-[0.15em] text-muted-foreground">BABY GARMENTS</div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 px-2 py-3 space-y-0.5 overflow-hidden">
        {navItems.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary-soft text-primary font-medium"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 mb-4 mx-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 rounded-xl bg-muted/60 p-2.5 hover:bg-muted transition-all group border border-border/40 text-left outline-none">
              <div className="h-9 w-9 rounded-full bg-primary/15 group-hover:bg-primary/25 grid place-items-center text-primary text-xs font-bold transition-colors shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{displayName}</div>
                <div className="text-[10px] text-muted-foreground truncate">{displayRole}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            className="w-56 rounded-xl shadow-(--shadow-card) ml-2"
          >
            <DropdownMenuLabel className="font-serif text-sm">Account Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/settings" onClick={onNavigate} className="flex items-center">
                <Settings className="h-4 w-4 mr-2" /> Edit Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Link to="/login" onClick={onNavigate} className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function AdminLayout({
  searchPlaceholder = "Search…",
  searchValue = "",
  onSearch,
  rightSlot,
  children,
}: {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { data: vipPulseData } = useQuery({
    queryKey: ["header-vip-pulse"],
    queryFn: () => orderService.getVIPActivity(),
    refetchInterval: 30000,
  });

  const vipActivities = vipPulseData?.activities || [];

  const { notifications, clearNotifications } = useAdminNotifications();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen w-full bg-[oklch(0.97_0.005_300)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-card border-r border-border">
        <SidebarNav pathname={pathname} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 bg-[oklch(0.97_0.005_300)]/90 backdrop-blur border-b border-border/60">
          <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 lg:px-10 py-3 sm:py-4">
            {/* Mobile menu trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden h-10 w-10 grid place-items-center rounded-full bg-card border border-border hover:bg-muted shrink-0"
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4 text-foreground/70" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-card">
                <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="relative flex-1 min-w-0 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearch?.(e.target.value)}
                className="pl-11 h-11 rounded-full bg-card border-border"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden lg:flex items-center gap-2">{rightSlot}</div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="relative h-10 w-10 grid place-items-center rounded-full bg-card border border-border hover:bg-muted shrink-0 text-(--color-gold-foreground) group"
                    aria-label="VIP Pulse"
                  >
                    <div className="absolute inset-0 bg-gold/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                    <Star className="h-4 w-4 relative z-10" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-(--color-gold-foreground) animate-pulse" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[420px] p-0 rounded-2xl shadow-(--shadow-card) border-border/50 overflow-hidden"
                  align="end"
                >
                  <div className="bg-linear-to-br from-gold/10 to-transparent p-4 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-(--color-gold-foreground) fill-current" />
                      <h3 className="font-serif font-semibold text-foreground">VIP Pulse</h3>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gold/20 text-(--color-gold-foreground) flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> Live
                    </span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="divide-y divide-border/40">
                      {vipActivities.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground italic">
                          No VIP activity detected...
                        </div>
                      ) : (
                        vipActivities.map((event, i) => {
                          const isPurchase = event.action.includes("purchase");
                          const isMilestone = event.action.includes("status");
                          const isCancelled = event.action.includes("cancelled");
                          const isRefunded = event.action.includes("refund");

                          const icon = isCancelled
                            ? "❌"
                            : isRefunded
                              ? "🔄"
                              : isPurchase
                                ? "✨"
                                : isMilestone
                                  ? "🎖️"
                                  : "🛒";

                          const tierStyles: Record<
                            string,
                            {
                              bg: string;
                              text: string;
                              gradient: string;
                              icon: React.ComponentType<{ className?: string }>;
                            }
                          > = {
                            Platinum: {
                              bg: "bg-slate-100",
                              text: "text-slate-900",
                              gradient: "from-slate-900 to-slate-700",
                              icon: Crown,
                            },
                            Gold: {
                              bg: "bg-gold/20",
                              text: "text-(--color-gold-foreground)",
                              gradient: "from-(--color-gold-foreground) to-amber-600",
                              icon: Trophy,
                            },
                            Silver: {
                              bg: "bg-blush/30",
                              text: "text-[color:var(--color-secondary)]",
                              gradient: "from-purple-700 to-fuchsia-600",
                              icon: Award,
                            },
                            Bronze: {
                              bg: "bg-indigo-50",
                              text: "text-indigo-600",
                              gradient: "from-indigo-700 to-blue-600",
                              icon: TargetIcon,
                            },
                            Standard: {
                              bg: "bg-muted/40",
                              text: "text-muted-foreground",
                              gradient: "from-muted-foreground to-slate-500",
                              icon: Users,
                            },
                          };

                          const style =
                            tierStyles[event.tier as keyof typeof tierStyles] ||
                            tierStyles.Standard;
                          const TierIcon = style.icon;

                          return (
                            <div key={i} className="p-4 hover:bg-muted/40 transition-colors group">
                              <div className="flex gap-3">
                                <div className="relative shrink-0">
                                  <div
                                    className={cn(
                                      "h-10 w-10 rounded-xl grid place-items-center text-lg shadow-sm border border-border/50",
                                      style.bg,
                                    )}
                                  >
                                    {icon}
                                  </div>
                                  {/* Mini Tier Badge */}
                                  <div
                                    className={cn(
                                      "absolute -top-1 -left-1 h-4 w-4 rounded-full z-10 shadow-sm flex items-center justify-center border border-card bg-linear-to-br",
                                      style.gradient,
                                    )}
                                  >
                                    <TierIcon className="h-2 w-2 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-foreground leading-none">
                                        {event.name}
                                      </span>
                                      <span
                                        className={cn(
                                          "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-bold",
                                          style.bg,
                                          style.text,
                                        )}
                                      >
                                        {event.tier}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {formatTimeAgoShort(event.date)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {event.action}
                                    </p>
                                    <span className="text-xs font-bold text-primary">
                                      {event.detail}
                                    </span>
                                  </div>

                                  {/* Quick Actions in Popover */}
                                  <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        const message = event.action.includes("purchase")
                                          ? `Hi ${event.name.split(" ")[0]}! ✨ I noticed your recent purchase of ${event.detail}. I'm your personal concierge—is there anything special I can help you with today?`
                                          : event.action.includes("status")
                                            ? `Congratulations on reaching ${event.tier} status, ${event.name.split(" ")[0]}! 🎖️ As our valued VIP, I've been assigned as your personal concierge. How can I assist you today?`
                                            : `Hi ${event.name.split(" ")[0]}! ✨ I'm your personal boutique concierge. I saw you were browsing—is there anything specific you're looking for?`;

                                        navigate({
                                          to: "/inbox",
                                          search: {
                                            recipientId:
                                              event.phone ||
                                              `ig-${event.name.toLowerCase().replace(/\s/g, ".")}`,
                                            customerName: event.name,
                                            message: message,
                                          },
                                        });
                                      }}
                                      className="text-[10px] font-bold text-primary hover:underline flex items-center"
                                    >
                                      <MessageCircle className="h-3 w-3 mr-1" /> Concierge
                                    </button>
                                    <button
                                      onClick={() => navigate({ to: "/customers" })}
                                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center ml-auto"
                                    >
                                      <User className="h-3 w-3 mr-1" /> Profile
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="relative h-10 w-10 grid place-items-center rounded-full bg-card border border-border hover:bg-muted"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4 text-foreground/70" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white animate-in zoom-in">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[380px] p-0 rounded-2xl shadow-(--shadow-card) border-border/50 overflow-hidden"
                  align="end"
                >
                  <div className="bg-muted/30 p-4 border-b border-border/50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {notifications.length} New
                    </span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-border/40">
                        {notifications.map((n, i: number) => {
                          const Icon =
                            n.type === "order"
                              ? Package
                              : n.type === "payment"
                                ? CreditCard
                                : n.type === "social_feed"
                                  ? Share2
                                  : n.type === "social_story"
                                    ? Smartphone
                                    : AlertCircle;
                          const colorClass =
                            n.type === "order"
                              ? "text-success bg-success/10"
                              : n.type === "payment"
                                ? "text-destructive bg-destructive/10"
                                : n.type === "social_feed" || n.type === "social_story"
                                  ? "text-primary bg-primary/10"
                                  : "text-primary bg-primary/10";

                          return (
                            <div
                              key={i}
                              className="p-4 hover:bg-muted/40 transition-colors group cursor-default"
                            >
                              <div className="flex gap-3">
                                <div
                                  className={`h-9 w-9 rounded-xl shrink-0 grid place-items-center ${colorClass}`}
                                >
                                  <Icon className="h-4.5 w-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <span className="text-xs font-bold text-foreground leading-none">
                                      {n.message}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                    {n.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-muted/50 grid place-items-center mb-3">
                          <BellOff className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-foreground">All caught up!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          No new notifications at the moment.
                        </p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="w-full py-3 text-xs font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border/50"
                    >
                      Mark all as read
                    </button>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {/* Mobile/tablet right-slot row */}
          {rightSlot && (
            <div className="lg:hidden flex flex-wrap items-center gap-2 px-4 sm:px-6 pb-3">
              {rightSlot}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function formatTimeAgoShort(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
