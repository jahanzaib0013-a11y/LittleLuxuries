import { useCart } from "@/context/CartContext";
import { formatPkr } from "@/lib/format-currency";
import { productService } from "@/lib/supabase-service";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCheckoutPricing } from "@/hooks/use-checkout-pricing";
export function CartSidebar({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { cart, removeFromCart, updateQuantity, getCartCount } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await productService.getProducts("published");
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!hasOpenedOnce) {
      setHasOpenedOnce(true);
      loadProducts();
    }
  }, [isOpen, hasOpenedOnce]);

  const items = cart
    .map((c) => {
      const p = products.find((x: any) => x.id === c.id);
      return p ? { ...c, product: p } : null;
    })
    .filter((x): x is any & { product: any } => !!x);

  const subtotal = items.reduce((s: number, i) => s + i.product.price * i.qty, 0);
  const { tax, taxLabel, shipping, total } = useCheckoutPricing({
    subtotal,
    countryCode: "PK",
  });

  const hasItems = items.length > 0;
  const allItemsLoaded = items.every((item) => item.product !== null);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "inset-0 left-0 right-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-[100vw] flex-col gap-0 overflow-hidden border-0 p-0",
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-lg sm:border-l",
          "[&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button]:min-h-11 [&>button]:min-w-11",
        )}
      >
        <SheetHeader className="shrink-0 border-b px-4 py-4 pr-14 text-left sm:px-6 sm:pr-16 sm:pb-4">
          <SheetTitle className="font-serif text-2xl">Your Cart</SheetTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {getCartCount()} {getCartCount() === 1 ? "item" : "items"}
          </p>
        </SheetHeader>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
          {loading || (!hasItems && cart.length > 0) || !allItemsLoaded || !hasOpenedOnce ? (
            <div className="space-y-4">
              {[1, 2].map((_, index) => (
                <div key={index} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-muted animate-pulse">
                    <div className="h-full w-full bg-gray-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="mb-1 h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-serif text-lg">Your cart is empty</h3>
              <p className="mb-4 text-sm text-muted-foreground">Add some items to get started</p>
              <Button onClick={() => onOpenChange(false)} asChild className="min-h-11">
                <Link to="/shop">Browse Shop</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex min-w-0 gap-3 rounded-xl border border-border bg-card p-3 sm:gap-4 sm:p-4"
                >
                  <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-20">
                    {!item.product ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary/80" />
                      </div>
                    ) : (
                      <img
                        src={item.product.image_url || item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-sm font-medium text-foreground">
                      {item.product.name}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                        {item.size}
                      </span>
                      {item.product.badge && (
                        <span className="inline-flex items-center rounded-md bg-gold px-2 py-0.5 text-xs font-medium text-gold-foreground">
                          {item.product.badge}
                        </span>
                      )}
                      {item.product.variant && (
                        <span
                          className="max-w-full truncate text-xs text-muted-foreground"
                          title={item.product.variant}
                        >
                          {item.product.variant}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-serif text-lg font-semibold text-primary">
                      {formatPkr(item.product.price * item.qty)}
                    </p>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                      <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-background px-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.size, Math.max(1, item.qty - 1))
                          }
                          className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-muted transition-colors disabled:opacity-40"
                          disabled={item.qty <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, item.qty + 1)}
                          className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-muted transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="ml-auto grid min-h-11 min-w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="shrink-0 min-w-0 space-y-3 border-t bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)] sm:space-y-4 sm:px-6 sm:py-6">
            <div className="min-w-0 space-y-2">
              <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="shrink-0 text-muted-foreground">Subtotal</span>
                <span className="min-w-0 truncate text-right font-medium tabular-nums">
                  {formatPkr(subtotal)}
                </span>
              </div>
              {tax > 0 && taxLabel && (
                <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                  <span className="shrink-0 text-muted-foreground">{taxLabel}</span>
                  <span className="min-w-0 truncate text-right font-medium tabular-nums">
                    {formatPkr(tax)}
                  </span>
                </div>
              )}
              <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="shrink-0 text-muted-foreground">Shipping</span>
                <span className="min-w-0 truncate text-right font-medium tabular-nums">
                  {shipping === 0 ? "Free" : formatPkr(shipping ?? 0)}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3 border-t pt-2">
                <span className="shrink-0 font-serif text-lg font-semibold">Total</span>
                <span className="min-w-0 truncate text-right font-serif text-lg font-semibold text-primary tabular-nums">
                  {formatPkr(total)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              asChild
              className="h-12 w-full max-w-full shrink-0 rounded-full px-4 text-xs font-semibold normal-case tracking-normal sm:text-sm"
            >
              <Link
                to="/checkout"
                className="flex w-full min-w-0 items-center justify-center gap-2"
              >
                <span className="sm:hidden">Checkout</span>
                <span className="hidden sm:inline">Proceed to Checkout</span>
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
