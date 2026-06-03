import { useCart } from "@/context/CartContext";
import { formatPkr } from "@/lib/format-currency";
import { productService } from "@/lib/supabase-service";
import { Minus, Plus, X, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function CartSidebar({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartCount } = useCart();
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
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping: number = 0;
  const total = subtotal + tax + shipping;

  const hasItems = items.length > 0;
  const allItemsLoaded = items.every((item) => item.product !== null);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-serif text-2xl">Your Cart</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {getCartCount()} {getCartCount() === 1 ? "item" : "items"}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading || (!hasItems && cart.length > 0) || !allItemsLoaded || !hasOpenedOnce ? (
            <div className="space-y-4">
              {[1, 2].map((_, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-xl bg-card border-border">
                  <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-muted animate-pulse">
                    <div className="h-full w-full bg-gray-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-lg mb-2">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mb-4">Add some items to get started</p>
              <Button onClick={() => onOpenChange(false)} asChild>
                <Link to="/shop">Browse Shop</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex gap-4 p-4 rounded-xl bg-card border border-border"
                >
                  <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {!item.product ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary/80">
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.product.image_url || item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.size}</p>
                    <h4 className="font-medium text-foreground text-sm line-clamp-1">
                      {item.product.name}
                    </h4>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-soft text-primary text-xs font-medium">
                        {item.size}
                      </span>
                      {item.product.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gold text-gold-foreground text-xs font-medium ml-2">
                          {item.product.badge}
                        </span>
                      )}
                      {item.product.variant && (
                        <span className="text-xs text-muted-foreground">
                          {item.product.variant}
                        </span>
                      )}
                    </div>
                    <p className="font-serif text-lg font-semibold text-primary mt-1">
                      {formatPkr(item.product.price * item.qty)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, Math.max(1, item.qty - 1))
                          }
                          className="grid size-6 place-items-center rounded-full hover:bg-muted transition-colors"
                          disabled={item.qty <= 1}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.qty + 1)}
                          className="grid size-6 place-items-center rounded-full hover:bg-muted transition-colors"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
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
          <div className="border-t p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPkr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span className="font-medium">{formatPkr(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? "Free" : formatPkr(shipping ?? 0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-serif text-lg font-semibold">Total</span>
                <span className="font-serif text-lg font-semibold text-primary">
                  {formatPkr(total)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              asChild
              className="w-full rounded-full h-12 text-sm font-semibold uppercase tracking-wider"
            >
              <Link to="/checkout">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
