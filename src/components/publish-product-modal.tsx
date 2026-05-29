import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Rocket,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Globe,
  X,
} from "lucide-react";
import { productService } from "@/lib/supabase-service";
import { useInvalidateProducts } from "@/lib/product-queries";
/* Social amplification — re-enable with UI block below
import { Switch } from "@/components/ui/switch";
import { Share2, Smartphone } from "lucide-react";
import {
  publishViaManus,
  type PublishViaManusInput,
  type PublishViaManusResult,
} from "@/lib/manus-server";
import { pushAdminNotification } from "@/lib/admin-notifications-bus";
*/
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sheetModalClass, sheetModalInnerClass, modalFooterClass } from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { type Database } from "@/lib/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface PublishProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onPublished?: () => void;
  onShowSocialPost?: (product: Product) => void;
}

export function PublishProductModal({
  open,
  onOpenChange,
  product,
  onPublished,
  onShowSocialPost,
}: PublishProductModalProps) {
  const invalidateProducts = useInvalidateProducts();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishType, setPublishType] = useState<"now" | "schedule">("now");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  /* Social amplification state — disabled for now
  const [enableSocialPost, setEnableSocialPost] = useState(false);
  const [postDelay, setPostDelay] = useState<"0" | "30" | "60" | "1440" | "custom">("0");
  const [customDelay, setCustomDelay] = useState("120");
  const [addInstagramStory, setAddInstagramStory] = useState(false);
  */

  if (!product) return null;

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const updates: Partial<Database["public"]["Tables"]["products"]["Update"]> = {
        status: publishType === "now" ? "published" : "scheduled",
      };

      if (publishType === "schedule" && publishDate && publishTime) {
        updates.scheduled_publish_at = new Date(`${publishDate}T${publishTime}`).toISOString();
      }

      await productService.updateProduct(product.id, updates);

      if (publishType === "now") {
        toast.success(`"${product.name}" is now live on the storefront!`);
      } else {
        toast.success(`"${product.name}" scheduled for ${publishDate} at ${publishTime}`);
      }

      /* Social amplification — disabled for now
      if (enableSocialPost && publishType === "now") {
        ...
      } else if (enableSocialPost) {
        toast.info("Social post scheduled to follow publication");
      }
      */

      await invalidateProducts();
      onPublished?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to update product status");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sheetModalClass, "sm:max-w-2xl")}>
        <ModalCloseBar onClose={() => onOpenChange(false)} />
        <div className={cn(sheetModalInnerClass, "flex min-h-0 flex-1 flex-col p-0! sm:p-0!")}>
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header Section */}
          <div className="p-6 pb-4 md:p-10 md:pb-6 bg-primary-soft/30 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="h-10 w-10 rounded-2xl bg-white shadow-sm grid place-items-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-8 w-8 hover:bg-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-serif text-primary tracking-tight">
                Launch Sequence
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-medium">
                Ready to introduce {product.name} to the world?
              </p>
            </div>
          </div>

          <div className="p-6 pt-6 md:p-10 md:pt-8 space-y-6 md:space-y-8">
            {/* Launch Timing */}
            <section className="space-y-4">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                Launch Strategy
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setPublishType("now")}
                  className={cn(
                    "p-6 rounded-3xl border transition-all flex items-start gap-4 text-left group",
                    publishType === "now"
                      ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                      : "bg-white text-muted-foreground border-border/50 hover:border-primary/30",
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-2xl grid place-items-center shrink-0",
                      publishType === "now" ? "bg-white/20" : "bg-primary-soft text-primary",
                    )}
                  >
                    <Rocket className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1">Publish Immediately</p>
                    <p className="text-[10px] opacity-70 leading-relaxed">
                      Go live across all channels instantly.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setPublishType("schedule")}
                  className={cn(
                    "p-6 rounded-3xl border transition-all flex items-start gap-4 text-left group",
                    publishType === "schedule"
                      ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                      : "bg-white text-muted-foreground border-border/50 hover:border-primary/30",
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-2xl grid place-items-center shrink-0",
                      publishType === "schedule" ? "bg-white/20" : "bg-primary-soft text-primary",
                    )}
                  >
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1">Schedule for Later</p>
                    <p className="text-[10px] opacity-70 leading-relaxed">
                      Automate your boutique's arrival.
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* Schedule Picker */}
            {publishType === "schedule" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Launch Date
                  </Label>
                  <Input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="h-12 rounded-2xl border-none bg-muted/30 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Launch Time
                  </Label>
                  <Input
                    type="time"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                    className="h-12 rounded-2xl border-none bg-muted/30 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {/* Social Amplification — disabled for now
            <div className="space-y-4">
              ...
              Social Amplification / Post Delay / Add Instagram Story UI
            </div>
            */}

            {/* Intelligence Summary */}
            <div className="flex items-center gap-3 py-2">
              <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">
                <span className="font-bold text-emerald-600">Pro Tip:</span> Products launched on
                Tuesday mornings tend to see 25% higher engagement.
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 md:p-10 border-t border-border/40 bg-muted/5 mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Ready for Deployment
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full px-8 h-12 font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={
                    isPublishing || (publishType === "schedule" && (!publishDate || !publishTime))
                  }
                  className="rounded-full px-12 h-12 font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 min-w-[180px] w-full sm:w-auto"
                >
                  {isPublishing ? (
                    <Clock className="h-4 w-4 animate-spin mr-2" />
                  ) : publishType === "now" ? (
                    <Rocket className="h-4 w-4 mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  {publishType === "now" ? "Launch Now" : "Schedule Launch"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
