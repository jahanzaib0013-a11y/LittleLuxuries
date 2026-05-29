import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Edit,
  Package,
  DollarSign,
  Tag,
  Box,
  FileText,
  Layout,
  Eye,
  Trash2,
  Heart,
  Share2,
  Info,
  CheckCircle2,
  Leaf,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { ShareProductModal } from "./share-product-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fullScreenModalWideClass } from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { formatPkr } from "@/lib/format-currency";
import { type Database } from "@/lib/supabase";

interface ViewProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Database["public"]["Tables"]["products"]["Row"] | null;
  onEdit?: () => void;
}

export function ViewProductModal({ open, onOpenChange, product, onEdit }: ViewProductModalProps) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "sustainability" | "care">("details");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (open && product) {
      setActiveImage(null);
      setActiveTab("details");
    }
  }, [open, product]);

  if (!product) return null;

  const mainImage = product.image_url;
  const gallery = [mainImage, ...(product.secondary_images || [])].filter(Boolean);
  const currentImage = activeImage || mainImage;

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={fullScreenModalWideClass}>
          <ModalCloseBar onClose={() => onOpenChange(false)} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Left Column: Visual Showcase */}
            <div className="min-h-0 w-full shrink-0 overflow-y-auto overscroll-contain border-b border-border/50 bg-muted/20 p-4 custom-scrollbar sm:p-5 lg:w-[450px] lg:border-b-0 lg:border-r lg:p-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                    Live Preview
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary px-3 py-1 bg-white"
                >
                  {product.category}
                </Badge>
              </div>

              <div className="flex-1 space-y-6">
                <div className="relative aspect-4/5 rounded-2xl sm:rounded-[28px] lg:rounded-[32px] overflow-hidden shadow-2xl bg-white border border-border/50 transition-all duration-700 group">
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-500"
                  />
                  {product.badge && (
                    <div className="absolute top-3 left-3 sm:top-6 sm:left-6">
                      <span className="bg-primary text-white text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-wider sm:tracking-widest shadow-xl">
                        {product.badge}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full h-10 w-10 shadow-lg"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={cn(
                        "aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-sm",
                        currentImage === img
                          ? "border-primary scale-105 shadow-md"
                          : "border-transparent hover:border-primary/30 opacity-70 hover:opacity-100",
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden"
                      >
                        <img
                          src={`https://i.pravatar.cc/100?img=${i + 10}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    <div className="h-8 w-8 rounded-full border-2 border-white bg-primary-soft flex items-center justify-center text-[10px] font-bold text-primary">
                      +12
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Added to 15 wishlists
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Administrative Workspace */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/30 bg-white p-4 pb-3 sm:p-6 sm:pb-4 lg:p-10 lg:pb-6">
                <div className="space-y-1 min-w-0">
                  <h1 className="font-serif text-xl sm:text-3xl lg:text-4xl text-primary tracking-tight wrap-break-word">
                    {product.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      {formatPkr(Number(product.price))}
                    </span>
                    <Separator orientation="vertical" className="h-4 bg-border/40" />
                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.2em] wrap-break-word">
                      {product.variant}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full h-10 w-10 hover:bg-muted/80 shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 custom-scrollbar sm:p-6 lg:p-10 space-y-5 lg:space-y-10">
                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-3 sm:gap-6 lg:gap-10 border-b border-border/30">
                  {(
                    [
                      { id: "details", label: "Overview", icon: FileText },
                      { id: "sustainability", label: "Sustainability", icon: Leaf },
                      { id: "care", label: "Care Instructions", icon: RotateCcw },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={cn(
                        "pb-3 sm:pb-4 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.08em] sm:tracking-widest transition-all relative",
                        activeTab === t.id
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary/70",
                      )}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                      {activeTab === t.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Dynamic Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {activeTab === "details" && (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary/60">
                          Product Narrative
                        </h4>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed italic font-medium bg-muted/10 p-4 sm:p-6 rounded-2xl sm:rounded-[24px] border border-border/40 wrap-break-word">
                          "{product.description || "No narrative provided for this luxury piece."}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        <div className="space-y-4">
                        <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary/60">
                            Inventory Allocation
                          </h4>
                          <div className="rounded-2xl border border-border/40 bg-muted/10 p-3 sm:p-4">
                            {product.sizes && product.sizes.length > 0 ? (
                              <>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    Available size range
                                  </p>
                                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary">
                                    {product.sizes.length} sizes
                                  </span>
                                </div>
                                <div className="-mx-1 overflow-x-auto px-1 pb-1 hide-scrollbar">
                                  <div className="flex min-w-max gap-2">
                                    {product.sizes.map((size: string, index: number) => (
                              <span
                                key={size}
                                        className={cn(
                                          "inline-flex min-h-9 min-w-20 items-center justify-center rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition",
                                          index === 0
                                            ? "border-primary/30 bg-primary text-primary-foreground shadow-primary/20"
                                            : "border-border/50 bg-white text-foreground",
                                        )}
                              >
                                {size}
                              </span>
                            ))}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">No sizes configured yet.</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                        <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary/60">
                            Stock Health
                          </h4>
                          {product.badge === "Out of Stock" ||
                          (product.units !== undefined && product.units <= 0) ? (
                            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                              <AlertCircle className="h-5 w-5 text-red-600" />
                              <div>
                                <p className="text-xs font-bold text-red-900 uppercase tracking-tighter">
                                  Out of Stock
                                </p>
                                <p className="text-[10px] text-red-700 font-medium">
                                  Awaiting restock
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              <div>
                                <p className="text-xs font-bold text-emerald-900 uppercase tracking-tighter">
                                  {product.units !== undefined && product.units < 5
                                    ? "Low Stock"
                                    : "In Stock & Healthy"}
                                </p>
                                <p className="text-[10px] text-emerald-700 font-medium">
                                  {product.units ?? 0} units ready for fulfillment
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "sustainability" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                          <Leaf className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-serif text-primary">
                            Eco-Conscious Craftsmanship
                          </h3>
                          <p className="text-xs text-muted-foreground font-medium">
                            Detailed sustainability promise for this product.
                          </p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed bg-emerald-50/30 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[28px] lg:rounded-[32px] border border-emerald-100/50 whitespace-pre-line wrap-break-word">
                        {product.sustainability ||
                          "100% certified organic, GOTS-grown materials. Natural wood buttons and non-toxic, low-impact dyes. Crafted in small batches by artisan partners. Recyclable, plastic-free packaging."}
                      </p>
                    </div>
                  )}

                  {activeTab === "care" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-primary-soft flex items-center justify-center text-primary shadow-sm">
                          <RotateCcw className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-serif text-primary">Preservation Guide</h3>
                          <p className="text-xs text-muted-foreground font-medium">
                            Maintaining the heirloom quality of this piece.
                          </p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed bg-primary-soft/10 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[28px] lg:rounded-[32px] border border-primary-soft/50 whitespace-pre-line wrap-break-word">
                        {product.care_instructions ||
                          "Machine wash cold on a delicate cycle with mild detergent. Lay flat to dry to preserve softness and shape. Iron on low if needed."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Controls Footer */}
              <div className="p-4 sm:p-6 lg:p-10 border-t border-border/40 bg-muted/5 mt-auto">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                      className="rounded-full h-11 w-11 sm:h-12 sm:w-12 hover:bg-primary-soft hover:text-primary transition-all shadow-sm shrink-0"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="rounded-full px-6 sm:px-8 h-11 sm:h-12 font-bold border-border/50 flex-1 sm:flex-none"
                    >
                      Close Preview
                    </Button>
                  </div>
                    {onEdit && (
                      <Button
                        onClick={() => {
                          onEdit();
                          onOpenChange(false);
                        }}
                      className="rounded-full h-11 sm:h-12 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 w-full sm:min-w-[180px] sm:self-end"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Refine Details
                      </Button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareProductModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        product={product}
      />
    </>
  );
}
