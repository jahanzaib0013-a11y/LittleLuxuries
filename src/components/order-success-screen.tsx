import { CheckCircle2, Package, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

export type OrderSuccessDetails = {
  orderNumber: string;
  total?: number;
  customerName?: string;
};

type OrderSuccessScreenProps = OrderSuccessDetails & {
  variant?: "page" | "modal";
  onDone: () => void;
  doneLabel?: string;
  showShopLink?: boolean;
};

export function OrderSuccessScreen({
  orderNumber,
  total,
  customerName,
  variant = "page",
  onDone,
  doneLabel = "Continue",
  showShopLink = variant === "page",
}: OrderSuccessScreenProps) {
  const isModal = variant === "modal";

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        isModal ? "justify-center px-4 py-10 sm:py-14" : "mx-auto max-w-lg px-4 py-12 sm:py-16",
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-150 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 sm:h-24 sm:w-24">
          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2} />
        </div>
      </div>

      <p className="label-eyebrow text-primary">Order confirmed</p>
      <h2
        className={cn(
          "mt-2 font-serif text-foreground",
          isModal ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
        )}
      >
        Thank you{customerName ? `, ${customerName.split(" ")[0]}` : ""}!
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
        {isModal
          ? "The boutique order has been recorded and is ready for fulfillment."
          : "We've received your order. Our team will prepare your pieces with care."}
      </p>

      <div className="mt-8 w-full max-w-sm rounded-2xl border border-border/60 bg-muted/30 p-5 text-left shadow-sm">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
          <Package className="h-3.5 w-3.5" />
          Order reference
        </div>
        <p className="mt-2 font-mono text-lg font-semibold tracking-wide text-foreground">
          #{orderNumber}
        </p>
        {total != null && total > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatPkr(total)}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex max-w-sm items-start gap-3 rounded-2xl border border-primary/15 bg-primary-soft/40 p-4 text-left">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {isModal ? (
            "You can track and update this order from the Orders dashboard."
          ) : (
            <>
              <span className="font-medium text-foreground">Cash on delivery</span> — pay when your
              order arrives. We'll reach out if we need anything else.
            </>
          )}
        </p>
      </div>

      <div
        className={cn(
          "mt-8 flex w-full max-w-sm flex-col gap-3",
          !isModal && "sm:flex-row sm:justify-center",
        )}
      >
        <Button
          type="button"
          onClick={onDone}
          className={cn(
            "min-h-11 w-full rounded-full text-base font-semibold",
            !isModal && "text-gold-foreground shadow-(--shadow-soft)",
          )}
          style={!isModal ? { background: "var(--gradient-gold)" } : undefined}
        >
          {doneLabel}
        </Button>
        {showShopLink ? (
          <Button
            type="button"
            variant="outline"
            asChild
            className="min-h-11 w-full rounded-full text-base font-semibold"
          >
            <Link to="/shop">Browse more</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
