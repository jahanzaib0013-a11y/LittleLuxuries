import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Eye, Megaphone, LayoutGrid, GalleryThumbnails, Layers, Check, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const Route = createFileRoute("/content")({
  head: () => ({ meta: [{ title: "Content Editor — Little Luxuries Admin" }] }),
  component: () => (
    <AdminLayout searchPlaceholder="Search content, assets, or settings…" rightSlot={<Button variant="outline" className="rounded-full h-10">Storefront View</Button>}>
      <ContentPage />
    </AdminLayout>
  ),
});

function ContentPage() {
  const [layout, setLayout] = useState("Editorial Grid");
  const [tint, setTint] = useState(0);
  const [align, setAlign] = useState<"l" | "c" | "r">("c");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground">Homepage Editor</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Curate the boutique experience with high-end visuals and targeted announcements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hero banner card */}
          <div className="rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Primary Hero Banner</h2>
                <p className="text-sm text-muted-foreground mt-1">Visible on mobile and desktop storefronts.</p>
              </div>
              <Button className="rounded-full">Save Changes</Button>
            </div>

            <div className="mt-6 rounded-xl bg-gradient-to-br from-primary-soft/60 via-card to-[color:var(--color-blush)]/30 p-6 sm:p-10 relative overflow-hidden">
              <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Seasonal Collection</div>
              <div className="mt-3 font-serif text-2xl sm:text-3xl text-foreground max-w-md">The Softest Organic Cotton Essentials</div>
              <button className="mt-5 text-sm font-medium text-primary border-b border-primary pb-0.5">Shop Now</button>
              <img src={logo} alt="" className="hidden sm:block absolute right-8 top-1/2 -translate-y-1/2 h-24 w-24 lg:h-32 lg:w-32 opacity-60" />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Banner Headline</Label>
                <Input defaultValue="The Softest Organic Cotton Essentials" className="mt-2 h-12 bg-muted/40 border-0 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Button Label</Label>
                  <Input defaultValue="Shop Now" className="mt-2 h-12 bg-muted/40 border-0 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Button Link (URL)</Label>
                  <Input defaultValue="/collections/organic-essentials" className="mt-2 h-12 bg-muted/40 border-0 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Announcement bar */}
          <div className="rounded-2xl bg-card p-7 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-2xl text-foreground">Announcement Bar</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Live Status:</span>
                <div className="h-6 w-11 rounded-full bg-[color:var(--color-gold)] relative">
                  <div className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-card" />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-primary-soft/40 p-4 flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-primary" />
              <span className="text-sm italic text-foreground flex-1">"Free delivery on orders above $100 — Limited Time Only"</span>
              <span className="text-xs px-3 py-1 rounded-full bg-[color:var(--color-gold)]/30 text-[color:var(--color-gold-foreground)] font-medium">PREVIEW</span>
            </div>

            <div className="mt-6">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message Content</Label>
              <Input defaultValue="Free delivery on orders above $100 — Limited Time Only" className="mt-2 h-12 bg-muted/40 border-0 rounded-xl" />
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Background Tint</Label>
                <div className="mt-3 flex items-center gap-3">
                  {["bg-primary", "bg-primary-soft", "bg-[color:var(--color-secondary)]", "bg-[color:var(--color-blush)]"].map((cls, i) => (
                    <button
                      key={i}
                      onClick={() => setTint(i)}
                      className={`h-9 w-9 rounded-full ${cls} ${tint === i ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Text Alignment</Label>
                <div className="mt-3 inline-flex bg-muted/40 rounded-full p-1">
                  {[
                    { v: "l" as const, I: AlignLeft },
                    { v: "c" as const, I: AlignCenter },
                    { v: "r" as const, I: AlignRight },
                  ].map(({ v, I }) => (
                    <button
                      key={v}
                      onClick={() => setAlign(v)}
                      className={`h-9 w-12 grid place-items-center rounded-full ${align === v ? "bg-card shadow" : ""}`}
                    >
                      <I className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <div className="rounded-2xl p-6 bg-gradient-to-br from-primary to-lilac text-primary-foreground">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-[color:var(--color-gold)]" /> Live Store View
            </div>
            <div className="mt-4 font-serif text-4xl">1,248</div>
            <div className="text-sm opacity-90 mt-1">Users currently browsing your collection.</div>
            <div className="mt-6 grid grid-cols-7 items-end gap-1 h-24">
              {[40, 60, 50, 80, 70, 95, 55].map((h, i) => (
                <div key={i} className="bg-primary-foreground/40 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="text-sm font-medium text-foreground">Layout Configuration</div>
            <div className="mt-4 space-y-2">
              {[
                { name: "Editorial Grid", icon: LayoutGrid },
                { name: "Minimal Carousel", icon: GalleryThumbnails },
                { name: "Full Width Stacks", icon: Layers },
              ].map(({ name, icon: I }) => (
                <button
                  key={name}
                  onClick={() => setLayout(name)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition ${
                    layout === name ? "bg-muted/50 text-foreground" : "text-foreground/70 hover:bg-muted/30"
                  }`}
                >
                  <I className="h-4 w-4" />
                  <span className="flex-1 text-left">{name}</span>
                  {layout === name && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-primary-soft/40 p-6">
            <div className="font-serif text-xl italic text-primary">Designer's Tip</div>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
              "For a high-end feel, ensure your hero images have at least 60% negative space. This allows the typography to remain legible while maintaining the airy aesthetic."
            </p>
            <a className="mt-4 inline-block text-sm text-primary font-medium">Read Style Guide →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
