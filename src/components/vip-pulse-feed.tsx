import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
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
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { orderService } from "@/lib/order-service";
import { useNavigate } from "@tanstack/react-router";

export function VIPPulseFeed() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const itemsPerPage = 2;

  const { data, isLoading, error } = useQuery({
    queryKey: ["real-vip-pulse"],
    queryFn: () => orderService.getVIPActivity(),
    refetchInterval: 30000, // Refresh every 30 seconds for "live" feel
  });

  const activities = data?.activities || [];

  return (
    <div className="bg-card rounded-[32px] border border-border/50 shadow-(--shadow-card) overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="p-6 border-b border-border/30 flex items-center justify-between bg-primary-soft/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">VIP Pulse</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Live Intelligence
              </p>
            </div>
          </div>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-full">
          {activities.length} Recent VIP Actions
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            <p className="text-xs text-muted-foreground font-serif italic">
              Syncing with boutique floor...
            </p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-xs text-destructive">Failed to sync VIP data.</div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted/30 grid place-items-center">
              <Zap className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              No VIP activity detected in this period.
            </p>
          </div>
        ) : (
          activities.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((act, idx) => {
            const isCancelled = act.action.includes("cancelled");
            const isRefunded = act.action.includes("refund");
            const Icon = isCancelled
              ? AlertCircle
              : isRefunded
                ? RefreshCw
                : act.action.includes("purchase")
                  ? CheckCircle
                  : act.action.includes("order")
                    ? ShoppingCart
                    : act.action.includes("status")
                      ? Award
                      : Eye;
            const iconColor = isCancelled
              ? "text-destructive"
              : isRefunded
                ? "text-blue-500"
                : act.action.includes("purchase")
                  ? "text-emerald-600"
                  : act.action.includes("order")
                    ? "text-blue-600"
                    : act.action.includes("status")
                      ? "text-amber-600"
                      : "text-slate-400";

            const nameParts = act.name.split(" ");
            const initials = (
              nameParts.length > 1
                ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
                : nameParts[0][0]
            )
              .toUpperCase()
              .slice(0, 2);

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
                bg: "bg-gold/30",
                text: "text-(--color-gold-foreground)",
                gradient: "from-[color:var(--color-gold-foreground)] to-amber-600",
                icon: Trophy,
              },
              Silver: {
                bg: "bg-blush/50",
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
                icon: User,
              },
            };

            const style = tierStyles[act.tier as keyof typeof tierStyles] || tierStyles.Standard;
            const TierIcon = style.icon;

            return (
              <div
                key={idx}
                className="group p-5 rounded-[28px] bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border border-border/40 hover:border-primary/20 relative overflow-hidden"
              >
                {/* Subtle gradient accent for VIPs */}
                <div
                  className={cn(
                    "absolute top-0 right-0 h-24 w-24 -mr-12 -mt-12 rounded-full opacity-[0.03] transition-opacity group-hover:opacity-[0.07]",
                    style.bg,
                  )}
                />

                <div className="flex items-start gap-4 relative z-10">
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "h-14 w-14 rounded-2xl grid place-items-center font-serif text-lg shadow-inner",
                        style.bg,
                        style.text,
                      )}
                    >
                      {initials}
                    </div>
                    {/* Tier Badge Overlay */}
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 h-6 w-6 rounded-lg z-10 shadow-lg flex items-center justify-center border-2 border-white bg-linear-to-br",
                        style.gradient,
                      )}
                    >
                      <TierIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate max-w-[140px]">
                          {act.name}
                        </h4>
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter shrink-0",
                            style.bg,
                            style.text,
                          )}
                        >
                          {act.tier}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(act.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={cn("p-1.5 rounded-lg bg-muted/50", iconColor)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <p className="text-xs font-medium text-foreground/80">{act.action}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between bg-muted/30 p-2.5 rounded-xl border border-border/20">
                      <div className="flex-1">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold leading-none mb-1">
                          Transaction Detail
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary truncate max-w-[120px]">
                            {act.detail}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0",
                              iconColor.replace("text-", "bg-").replace("600", "100"),
                              iconColor,
                            )}
                          >
                            {act.action.split(" ").pop()}
                          </span>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-border/40 mx-2" />
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="rounded-full h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 shadow-md active:scale-95 transition-all"
                          onClick={() => {
                            const message = act.action.includes("purchase")
                              ? `Hi ${act.name.split(" ")[0]}! ✨ I noticed your recent purchase of ${act.detail}. I'm your personal concierge—is there anything special I can help you with today?`
                              : act.action.includes("status")
                                ? `Congratulations on reaching ${act.tier} status, ${act.name.split(" ")[0]}! 🎖️ As our valued VIP, I've been assigned as your personal concierge. How can I assist you today?`
                                : `Hi ${act.name.split(" ")[0]}! ✨ I'm your personal boutique concierge. I saw you were browsing—is there anything specific you're looking for?`;

                            navigate({
                              to: "/inbox",
                              search: {
                                recipientId:
                                  act.phone || `ig-${act.name.toLowerCase().replace(/\s/g, ".")}`,
                                customerName: act.name,
                                message: message,
                              },
                            });
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Concierge
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-primary/5 text-primary active:scale-95 transition-all"
                          onClick={() => navigate({ to: "/customers" })}
                          title="View Profile"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-muted/20 border-t border-border/30">
        {activities.length > itemsPerPage && (
          <div className="flex items-center justify-between px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
            >
              ← Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(activities.length / itemsPerPage) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all",
                    page === i ? "bg-primary w-4" : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(Math.ceil(activities.length / itemsPerPage) - 1, p + 1))
              }
              disabled={(page + 1) * itemsPerPage >= activities.length}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString();
}
