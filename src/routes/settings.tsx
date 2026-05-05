import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, CreditCard, Plus, Globe, Plane, ShieldCheck, Smartphone } from "lucide-react";
import logo from "@/assets/logo.png";
import { shippingZones } from "@/lib/admin-data";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Store Settings — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout searchPlaceholder="Search settings…">
      <SettingsPage />
    </AdminLayout>
  ),
});

function SettingsPage() {
  const [methods, setMethods] = useState({ card: true, paypal: true, apple: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-primary">Store Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your boutique's global configurations, payment methods, and regional logistics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store profile */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-primary">Store Profile</h2>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Identity & Contact</div>
            </div>
            <Button className="rounded-full">Save Changes</Button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
            <div className="text-center">
              <div className="h-32 w-32 rounded-2xl bg-muted/40 grid place-items-center">
                <img src={logo} alt="" className="h-20 w-20 object-contain" />
              </div>
              <button className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary"><Camera className="h-3.5 w-3.5" /> Change Logo</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Store Name" value="Little Luxuries Boutique" />
              <Field label="Business Email" value="concierge@littleluxuries.com" />
              <Field label="Contact Number" value="+1 (555) 892-0192" />
              <Field label="Timezone" value="London (GMT +00)" />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-2xl text-primary">Payment Methods</h2>
          <div className="mt-6 space-y-3">
            <PaymentRow icon={<CreditCard className="h-5 w-5 text-primary" />} title="Credit Cards" sub="Visa, Mastercard, Amex" on={methods.card} onChange={(v) => setMethods({ ...methods, card: v })} />
            <PaymentRow icon={<div className="text-primary font-bold text-sm">P</div>} title="PayPal" sub="Standard & Express" on={methods.paypal} onChange={(v) => setMethods({ ...methods, paypal: v })} />
            <PaymentRow icon={<Smartphone className="h-5 w-5 text-primary" />} title="Apple Pay" sub="iOS/Safari checkouts" on={methods.apple} onChange={(v) => setMethods({ ...methods, apple: v })} />
          </div>
          <button className="mt-5 w-full py-3 rounded-full border border-dashed border-primary/40 text-sm text-primary hover:bg-primary-soft/30">
            + Add Custom Gateway
          </button>
        </div>
      </div>

      {/* Shipping zones */}
      <div className="rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-2xl text-primary">Shipping & Logistics</h2>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Zones & Taxation Rules</div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-full">Tax Settings</Button>
            <Button className="rounded-full"><Plus className="h-4 w-4" /> Add Zone</Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {shippingZones.map((z) => (
            <div key={z.name} className="rounded-2xl bg-muted/30 p-5">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl bg-card grid place-items-center text-primary">
                  {z.icon === "globe" ? <Globe className="h-5 w-5" /> : <Plane className="h-5 w-5" />}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${z.status === "Active" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}>
                  {z.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-5 font-serif text-xl text-foreground">{z.name}</div>
              <p className="text-sm text-muted-foreground mt-1">{z.desc}</p>
              <div className="mt-4 text-sm text-foreground/80">🚚 {z.info}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin account */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-primary to-lilac text-primary-foreground">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_auto] gap-6 items-center">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-card/20 grid place-items-center text-4xl">👤</div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.2em] opacity-80">Administrator Account</div>
            <div className="font-serif text-2xl sm:text-3xl mt-2">Eleanor Vance</div>
            <div className="text-sm opacity-90 mt-1">Senior Store Manager • Full Permissions</div>
            <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
              <Button variant="secondary" className="rounded-full">Edit Profile</Button>
              <Button variant="outline" className="rounded-full bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">Two-Factor Auth</Button>
            </div>
          </div>
          <div className="rounded-xl bg-card/15 p-4 text-xs space-y-2 md:col-span-2 xl:col-span-1 xl:min-w-[200px]">
            <div className="uppercase tracking-[0.15em] opacity-80">Login Activity</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Current: London, UK</div>
            <div className="opacity-80">2h ago: iPhone 15 Pro</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[color:var(--color-gold)] shrink-0" /> Last backup: October 24, 2023 at 10:15 AM</div>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground">Discard All</button>
          <Button className="rounded-full">Save All Changes</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input defaultValue={value} className="mt-2 h-12 bg-muted/40 border-0 rounded-xl" />
    </div>
  );
}

function PaymentRow({ icon, title, sub, on, onChange }: { icon: React.ReactNode; title: string; sub: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
      <div className="h-10 w-10 rounded-xl bg-card grid place-items-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={`h-6 w-11 rounded-full relative transition ${on ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition ${on ? "right-0.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
