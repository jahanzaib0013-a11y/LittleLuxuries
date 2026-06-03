import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { productService } from "@/lib/supabase-service";
import { orderService, type CartItem, type CheckoutPrefillSnapshot } from "@/lib/order-service";
import { couponService, type Coupon } from "@/lib/coupon-service";
import { toast } from "sonner";
import {
  Banknote,
  Minus,
  Plus,
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  MapPin,
  Mail,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { CartSidebar } from "@/components/cart-sidebar";
import { formatPkr } from "@/lib/format-currency";
import { getAcquisitionData, storeUTMParameters } from "@/lib/utils";
import type { Database } from "@/lib/supabase";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Little Luxuries" },
      { name: "description", content: "Review your order and complete your purchase." },
    ],
  }),
  component: Checkout,
});

type CartItemState = { id: string; size: string; qty: number };
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const CHECKOUT_PREFILL_KEY = "littleluxuries_checkout_prefill_v1";

const initialCheckoutForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  referralSource: "",
};

function buildPrefillPayload(d: typeof initialCheckoutForm): CheckoutPrefillSnapshot {
  return {
    email: d.email.trim(),
    firstName: d.firstName.trim(),
    lastName: d.lastName.trim(),
    phone: d.phone.trim(),
    streetAddress: d.streetAddress.trim(),
    city: d.city.trim(),
    postalCode: d.postalCode.trim(),
    country: "PK",
  };
}

function snapshotToFormPartial(s: CheckoutPrefillSnapshot): Partial<typeof initialCheckoutForm> {
  return {
    email: s.email,
    firstName: s.firstName,
    lastName: s.lastName,
    phone: s.phone ?? "",
    streetAddress: s.streetAddress,
    city: s.city,
    postalCode: s.postalCode,
  };
}

function readStoredCheckoutPrefill(): CheckoutPrefillSnapshot | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_PREFILL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<CheckoutPrefillSnapshot>;
    if (!p?.email || typeof p.email !== "string") {
      return null;
    }
    return {
      email: p.email,
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      phone: p.phone ?? "",
      streetAddress: p.streetAddress ?? "",
      city: p.city ?? "",
      postalCode: p.postalCode ?? "",
      country: p.country ?? "PK",
    };
  } catch {
    return null;
  }
}

function persistCheckoutPrefill(d: typeof initialCheckoutForm) {
  try {
    localStorage.setItem(CHECKOUT_PREFILL_KEY, JSON.stringify(buildPrefillPayload(d)));
  } catch {
    // ignore quota / private mode
  }
}

type CheckoutPrefillBanner = {
  key: number;
  variant: "device" | "saved_profile" | "last_order";
  title: string;
  subtitle: string;
};

function Checkout() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart, isCartOpen, openCart, closeCart } =
    useCart();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [formData, setFormData] = useState(initialCheckoutForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressLookup, setAddressLookup] = useState<"idle" | "loading">("idle");
  const [prefillBanner, setPrefillBanner] = useState<CheckoutPrefillBanner | null>(null);
  const prefillBannerKey = useRef(0);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const showPrefillBanner = useCallback(
    (variant: CheckoutPrefillBanner["variant"], title: string, subtitle: string) => {
      prefillBannerKey.current += 1;
      setPrefillBanner({ key: prefillBannerKey.current, variant, title, subtitle });
    },
    [],
  );
  useEffect(() => {
    // Store UTM parameters when component mounts
    storeUTMParameters();

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
    loadProducts();
  }, []);

  // Restore last checkout details (browser) then align with latest order for that email (any device)
  useEffect(() => {
    const local = readStoredCheckoutPrefill();
    if (local) {
      setFormData((prev) => ({ ...prev, ...snapshotToFormPartial(local) }));
      showPrefillBanner(
        "device",
        "Welcome back",
        "We restored your last details on this device. Syncing with your saved profile…",
      );
      void orderService
        .getLatestCheckoutPrefillByEmail(local.email)
        .then(({ snapshot, source }) => {
          if (!snapshot) return;
          setFormData((prev) => ({ ...prev, ...snapshotToFormPartial(snapshot) }));
          if (source === "saved_profile") {
            showPrefillBanner(
              "saved_profile",
              "Saved address loaded",
              "Pulled from your Little Luxuries profile. Edit anything before you place this order.",
            );
          } else if (source === "last_order") {
            showPrefillBanner(
              "last_order",
              "Previous order found",
              "We filled this from your most recent order. Save a default address on your next checkout for the fastest experience.",
            );
          }
        });
    }
  }, [showPrefillBanner]);

  const handleEmailBlur = useCallback(() => {
    setAddressLookup("loading");
    void orderService
      .getLatestCheckoutPrefillByEmail(formData.email)
      .then(({ snapshot, source }) => {
        if (snapshot) {
          setFormData((prev) => ({ ...prev, ...snapshotToFormPartial(snapshot) }));
          if (source === "saved_profile") {
            showPrefillBanner(
              "saved_profile",
              "Saved address loaded",
              "From your account profile — change anything you need before ordering.",
            );
          } else if (source === "last_order") {
            showPrefillBanner(
              "last_order",
              "Address from your last order",
              "We couldn’t find a saved profile address yet, so we used your most recent shipment.",
            );
          }
        }
      })
      .finally(() => setAddressLookup("idle"));
  }, [formData.email, showPrefillBanner]);

  const items = cart
    .map((c) => {
      const p = products.find((x) => x.id === c.id);
      return p ? { ...c, product: p } : null;
    })
    .filter((x): x is CartItemState & { product: ProductRow } => !!x);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  // Calculate discount
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discount = appliedCoupon.discount_value;
    }
  }

  const taxableAmount = subtotal - discount;
  const tax = +(taxableAmount * 0.08).toFixed(2);
  const shipping: number = 0; // Free shipping for now
  const total = taxableAmount + tax + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const coupon = await couponService.validateCoupon(couponCode);
      if (coupon) {
        setAppliedCoupon(coupon);
        setCouponCode("");
        toast.success(`Coupon "${coupon.code}" applied!`);
      } else {
        setCouponError("Invalid or expired coupon code");
        toast.error("Invalid or expired coupon code");
      }
    } catch (err) {
      console.error("Error applying coupon:", err);
      setCouponError("Failed to validate coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemoveItem = (id: string, size: string) => {
    removeFromCart(id, size);
  };

  const handleQuantityChange = (id: string, size: string, newQty: number) => {
    updateQuantity(id, size, newQty);
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (
      !formData.email ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.streetAddress ||
      !formData.city ||
      !formData.postalCode
    ) {
      setOrderError("Please fill in all required fields");
      return;
    }

    if (items.length === 0) {
      setOrderError("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      // Get acquisition data
      const acquisitionData = getAcquisitionData(formData.referralSource);

      // Convert cart items to order items format
      const orderItems: CartItem[] = items.map((item) => ({
        product_id: item.id,
        product_name: item.product.name,
        product_image_url: item.product.image_url,
        size: item.size,
        quantity: item.qty,
        unit_price: item.product.price,
        variant: item.product.variant,
      }));

      // Create order with acquisition data
      const { order, error } = await orderService.createOrder({
        acquisition_data: acquisitionData,
        customer_email: formData.email,
        customer_first_name: formData.firstName,
        customer_last_name: formData.lastName,
        customer_phone: formData.phone,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          street_address: formData.streetAddress,
          city: formData.city,
          postal_code: formData.postalCode,
          country: "PK",
        },
        subtotal,
        tax_amount: tax,
        shipping_amount: shipping,
        discount_amount: discount,
        total_amount: total,
        currency: "PKR",
        items: orderItems,
      });

      if (appliedCoupon) {
        await couponService.incrementRedemption(appliedCoupon.id);
      }

      if (error || !order) {
        throw new Error(error || "Failed to create order");
      }

      setCreatedOrderId(order.id);
      setOrderSuccess(true);

      persistCheckoutPrefill(formData);

      // Clear cart after successful order
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <CartSidebar isOpen={isCartOpen} onOpenChange={closeCart} />
      <section className="bg-secondary/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <span className="label-eyebrow">Almost there</span>
          <h1 className="mt-2 font-serif text-5xl text-foreground">Checkout</h1>
          <p className="mt-2 text-muted-foreground">
            Review your selection of hand-crafted essentials.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.5fr_1fr]">
        {/* LEFT */}
        <div className="space-y-10">
          {/* Items */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-(--shadow-card) md:p-8">
            <h2 className="font-serif text-2xl">Your Selection</h2>
            <div className="mt-6 divide-y divide-border">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((_, index) => (
                    <div key={index} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-muted animate-pulse">
                        <div className="h-full w-full bg-gray-200" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse mb-1" />
                        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 && !orderSuccess ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Your cart is empty.{" "}
                  <Link to="/shop" className="text-primary hover:underline">
                    Continue shopping
                  </Link>
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-card border border-border shadow-sm">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-lg font-medium text-foreground leading-tight">
                            {item.product.name}
                          </h3>
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
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-serif text-xl font-semibold text-primary">
                            {formatPkr(item.product.price * item.qty)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatPkr(item.product.price)} each
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-1">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.size, Math.max(1, item.qty - 1))
                            }
                            className="grid size-8 place-items-center rounded-full hover:bg-muted transition-colors"
                            disabled={item.qty <= 1}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{item.qty}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.size, item.qty + 1)}
                            className="grid size-8 place-items-center rounded-full hover:bg-muted transition-colors"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id, item.size)}
                          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shipping — delivery details */}
          <div className="rounded-3xl border border-border/60 bg-card shadow-(--shadow-card) overflow-hidden ring-1 ring-black/3">
            <div className="relative border-b border-border/40 bg-linear-to-br from-primary/[0.07] via-card to-muted/25 px-6 py-6 md:px-8 md:py-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border/60 bg-background/90 shadow-sm text-primary">
                    <MapPin className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
                      Delivery
                    </p>
                    <h2 className="mt-1 font-serif text-2xl md:text-[1.65rem] text-foreground tracking-tight">
                      Where should we send this?
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {prefillBanner && (
                <div
                  key={prefillBanner.key}
                  className={`relative flex gap-3 rounded-2xl border px-4 py-3.5 pr-10 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                    prefillBanner.variant === "saved_profile"
                      ? "border-emerald-500/25 bg-emerald-500/[0.07] text-foreground"
                      : prefillBanner.variant === "last_order"
                        ? "border-primary/25 bg-primary-soft/50 text-foreground"
                        : "border-border bg-muted/40 text-foreground"
                  }`}
                  role="status"
                >
                  <Sparkles
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      prefillBanner.variant === "saved_profile"
                        ? "text-emerald-600"
                        : "text-primary"
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{prefillBanner.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {prefillBanner.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrefillBanner(null)}
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
                    aria-label="Dismiss notice"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-border/50 bg-muted/15 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Step 1 · Contact email
                  </span>
                </div>
                <Field
                  label="Email"
                  placeholder="eleanor@example.com"
                  value={formData.email}
                  onChange={(v) => handleInputChange("email", v)}
                  onBlur={handleEmailBlur}
                  type="email"
                  required
                />
                {addressLookup === "loading" && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
                    Checking for a saved address…
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserRound className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Step 2 · Recipient &amp; address
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="First name"
                    placeholder="Eleanor"
                    value={formData.firstName}
                    onChange={(v) => handleInputChange("firstName", v)}
                    required
                  />
                  <Field
                    label="Last name"
                    placeholder="Vance"
                    value={formData.lastName}
                    onChange={(v) => handleInputChange("lastName", v)}
                    required
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Phone (optional)"
                      placeholder="+92-300-1234567"
                      value={formData.phone}
                      onChange={(v) => handleInputChange("phone", v)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Street address"
                      placeholder="123 Willow Lane, Apartment 4B"
                      value={formData.streetAddress}
                      onChange={(v) => handleInputChange("streetAddress", v)}
                      required
                    />
                  </div>
                  <Field
                    label="City"
                    placeholder="Lahore"
                    value={formData.city}
                    onChange={(v) => handleInputChange("city", v)}
                    required
                  />
                  <Field
                    label="Postal code"
                    placeholder="54000"
                    value={formData.postalCode}
                    onChange={(v) => handleInputChange("postalCode", v)}
                    required
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-4 py-4 sm:px-5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  How did you hear about us?
                </label>
                <select
                  value={formData.referralSource}
                  onChange={(e) => handleInputChange("referralSource", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select an option…</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="google">Google Search</option>
                  <option value="friend">Friend/Family</option>
                  <option value="instagram_ad">Instagram Ad</option>
                  <option value="facebook_ad">Facebook Ad</option>
                  <option value="email">Email Newsletter</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment — cash on delivery */}
          <div>
            <h2 className="font-serif text-2xl">Payment Method</h2>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card)">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-soft/50 border border-primary/20">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center">
                  <Banknote className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-foreground">Cash on delivery (COD)</p>
                  <p className="text-xs text-muted-foreground">
                    Pay in cash when your order is delivered. No card or wallet needed online.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Your order is confirmed for fulfilment; our team will collect payment at your door
                according to the total shown in your confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Summary */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-(--shadow-card)">
            <h2 className="font-serif text-2xl">Order Summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Subtotal" value={formatPkr(subtotal)} />
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 font-medium">
                  <dt className="flex items-center gap-1.5">
                    <Tag className="size-3" />
                    Discount ({appliedCoupon.code})
                    <button
                      onClick={removeCoupon}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </dt>
                  <dd>-{formatPkr(discount)}</dd>
                </div>
              )}
              <Row label="Shipping" value={shipping === 0 ? "Free" : formatPkr(shipping)} />
              <Row label="Taxes (8%)" value={formatPkr(tax)} />
            </dl>

            {!appliedCoupon && (
              <div className="mt-6 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="rounded-xl bg-primary-soft px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-white disabled:opacity-50"
                  >
                    {isApplyingCoupon ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-destructive ml-1">{couponError}</p>}
              </div>
            )}
            {orderError && (
              <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{orderError}</p>
              </div>
            )}
            <div className="my-6 border-t border-border" />
            <div className="flex items-baseline justify-between">
              <span className="label-eyebrow text-foreground!">Total</span>
              <span className="font-serif text-3xl text-primary">{formatPkr(total)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || orderSuccess || items.length === 0}
              className="mt-6 w-full rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-wider text-gold-foreground shadow-(--shadow-soft) transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-gold)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : orderSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Order Placed
                </>
              ) : (
                "Place Order"
              )}
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Banknote className="size-3" /> Cash on delivery — pay when you receive your order
            </p>
          </div>

          <div className="flex gap-4 rounded-3xl border border-border bg-primary-soft/40 p-6">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-primary">
              <Tag className="size-4" />
            </div>
            <div>
              <p className="label-eyebrow">Little Luxuries Promise</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Each item is hand-inspected for softness and safety before shipping in our signature
                sustainable packaging.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </Layout>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  hint,
  type = "text",
  required = false,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  hint?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label-eyebrow text-foreground!">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={() => onBlur?.()}
        className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{hint}</p> : null}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={muted ? "text-muted-foreground" : "font-medium text-foreground"}>{value}</dd>
    </div>
  );
}
