import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site-layout";
import { products } from "@/lib/products";
import { Lock, Minus, Plus, Tag } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Little Luxuries" },
      { name: "description", content: "Review your order and complete your purchase." },
    ],
  }),
  component: Checkout,
});

type CartItem = { id: string; size: string; qty: number };

function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([
    { id: "cloud-soft-onesie", size: "3–6M", qty: 1 },
    { id: "wool-knitted-booties", size: "0–3M", qty: 1 },
  ]);

  const items = cart
    .map((c) => {
      const p = products.find((x) => x.id === c.id);
      return p ? { ...c, product: p } : null;
    })
    .filter((x): x is CartItem & { product: (typeof products)[number] } => !!x);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = subtotal + tax;

  return (
    <Layout>
      <section className="bg-secondary/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <span className="label-eyebrow">Almost there</span>
          <h1 className="mt-2 font-serif text-5xl text-foreground">Checkout</h1>
          <p className="mt-2 text-muted-foreground">Review your selection of hand-crafted essentials.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.5fr_1fr]">
        {/* LEFT */}
        <div className="space-y-10">
          {/* Items */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
            <h2 className="font-serif text-2xl">Your Selection</h2>
            <div className="mt-6 divide-y divide-border">
              {items.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Your cart is empty. <Link to="/shop" className="text-primary hover:underline">Continue shopping</Link>
                </p>
              )}
              {items.map((item) => (
                <div key={item.id} className="flex gap-5 py-5">
                  <div className="size-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-lg leading-tight">{item.product.name}</h3>
                        <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                          Size: {item.size}
                        </p>
                      </div>
                      <span className="font-medium text-primary">${item.product.price * item.qty}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 rounded-full border border-border p-1">
                        <button
                          onClick={() =>
                            setCart((c) =>
                              c.map((x) => (x.id === item.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x)),
                            )
                          }
                          className="grid size-7 place-items-center rounded-full hover:bg-muted"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium">{item.qty}</span>
                        <button
                          onClick={() =>
                            setCart((c) => c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x)))
                          }
                          className="grid size-7 place-items-center rounded-full hover:bg-muted"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => setCart((c) => c.filter((x) => x.id !== item.id))}
                        className="text-xs font-semibold uppercase tracking-wider text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div>
            <h2 className="font-serif text-2xl">Shipping Address</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="First Name" placeholder="Eleanor" />
              <Field label="Last Name" placeholder="Vance" />
              <div className="sm:col-span-2">
                <Field label="Street Address" placeholder="123 Willow Lane, Apartment 4B" />
              </div>
              <Field label="City" placeholder="San Francisco" />
              <Field label="Postal Code" placeholder="94103" />
            </div>
          </div>

          {/* Payment */}
          <div>
            <h2 className="font-serif text-2xl">Payment Information</h2>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <Field label="Card Number" placeholder="0000 0000 0000 0000" />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Expiry Date" placeholder="MM/YY" />
                <Field label="CVV" placeholder="•••" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Summary */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
            <h2 className="font-serif text-2xl">Order Summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
              <Row label="Shipping" value="Calculated next" muted />
              <Row label="Taxes" value={`$${tax.toFixed(2)}`} />
            </dl>
            <div className="my-6 border-t border-border" />
            <div className="flex items-baseline justify-between">
              <span className="label-eyebrow !text-foreground">Total</span>
              <span className="font-serif text-3xl text-primary">${total.toFixed(2)}</span>
            </div>
            <button className="mt-6 w-full rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-wider text-gold-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
              style={{ background: "var(--gradient-gold)" }}>
              Place Order
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Lock className="size-3" /> Secure encrypted checkout
            </p>
          </div>

          <div className="flex gap-4 rounded-3xl border border-border bg-primary-soft/40 p-6">
            <div className="grid size-10 flex-shrink-0 place-items-center rounded-full bg-card text-primary">
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

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="label-eyebrow !text-foreground">{label}</label>
      <input
        placeholder={placeholder}
        className="mt-2 w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
      />
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
