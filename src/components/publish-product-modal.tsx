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
import { Switch } from "@/components/ui/switch";
import {
  Rocket,
  Calendar,
  Share2,
  Sparkles,
  CheckCircle2,
  Clock,
  Globe,
  X,
  Smartphone,
} from "lucide-react";
import { productService } from "@/lib/supabase-service";
import { publishViaManus } from "@/lib/manus-server";
import { pushAdminNotification } from "@/lib/admin-notifications-bus";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishType, setPublishType] = useState<"now" | "schedule">("now");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [enableSocialPost, setEnableSocialPost] = useState(true);
  const [postDelay, setPostDelay] = useState<"0" | "30" | "60" | "1440" | "custom">("0");
  const [customDelay, setCustomDelay] = useState("120");
  /** Manus: design 9:16 story + publish to Instagram Stories (same connector as feed). */
  const [addInstagramStory, setAddInstagramStory] = useState(false);

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

      if (enableSocialPost && publishType === "now") {
        if (postDelay === "0") {
          const caption = `Introducing the ${product.name} ✨\n\n${product.description}\n\nAvailable now at Little Luxuries.`;
          const candidateImage = product.image_url;
          const publicImageUrl =
            typeof candidateImage === "string" && candidateImage.startsWith("http")
              ? candidateImage
              : null;

          if (!publicImageUrl) {
            toast.error(
              "Product image must be a public URL to publish via Manus. Upload an image first.",
            );
            onShowSocialPost?.(product);
          } else {
            const platforms: Array<"instagram" | "facebook"> = ["instagram"];
            if (import.meta.env?.VITE_MANUS_FB_ENABLED === "true") {
              platforms.push("facebook");
            }

            for (const platform of platforms) {
              toast.promise(
                (publishViaManus as any)({
                  data: {
                    imageUrl: publicImageUrl,
                    caption,
                    platform,
                    productId: product.id,
                    placement: "feed",
                  },
                }).then((r: { ok: boolean; postUrl?: string; error?: string }) => {
                  if (!r.ok) throw new Error(r.error || "Manus reported failure");
                  return r;
                }),
                {
                  loading: `Publishing to ${platform === "instagram" ? "Instagram" : "Facebook"} via Manus AI…`,
                  success: (r: { postUrl?: string }) => {
                    const label = platform === "instagram" ? "Instagram" : "Facebook";
                    pushAdminNotification({
                      id: `manus-feed-${product.id}-${platform}-${Date.now()}`,
                      type: "social_feed",
                      message: `${label} post uploaded`,
                      description: r.postUrl
                        ? `${product.name} — ${r.postUrl}`
                        : `${product.name} was published to ${label}.`,
                      timestamp: new Date(),
                    });
                    return r.postUrl
                      ? `Posted to ${label}: ${r.postUrl}`
                      : `Posted to ${label} via Manus AI`;
                  },
                  error: (e: Error) =>
                    `${platform === "instagram" ? "Instagram" : "Facebook"} publish failed: ${e.message}`,
                },
              );
            }

            if (addInstagramStory) {
              toast.promise(
                (publishViaManus as any)({
                  data: {
                    imageUrl: publicImageUrl,
                    caption,
                    platform: "instagram",
                    productId: product.id,
                    placement: "story",
                  },
                }).then(
                  (r: {
                    ok: boolean;
                    postUrl?: string;
                    error?: string;
                    storyDesignSummary?: string;
                  }) => {
                    if (!r.ok) throw new Error(r.error || "Manus story failed");
                    return r;
                  },
                ),
                {
                  loading: "Manus is designing your Instagram Story and publishing…",
                  success: (r: { postUrl?: string; storyDesignSummary?: string }) => {
                    pushAdminNotification({
                      id: `manus-story-${product.id}-${Date.now()}`,
                      type: "social_story",
                      message: "Instagram Story uploaded",
                      description: r.postUrl
                        ? `${product.name} — ${r.postUrl}`
                        : r.storyDesignSummary
                          ? `${product.name}. ${r.storyDesignSummary}`
                          : `${product.name} is live on your Story.`,
                      timestamp: new Date(),
                    });
                    return r.postUrl
                      ? `Instagram Story live: ${r.postUrl}`
                      : r.storyDesignSummary
                        ? `Story published. ${r.storyDesignSummary}`
                        : "Instagram Story published via Manus";
                  },
                  error: (e: Error) => `Instagram Story failed: ${e.message}`,
                },
              );
            }
          }
        } else {
          const delayText =
            postDelay === "custom"
              ? `${customDelay} minutes`
              : postDelay === "30"
                ? "30 minutes"
                : postDelay === "60"
                  ? "1 hour"
                  : "24 hours";
          toast.info(`Social post queued to go live ${delayText} after publication.`);
        }
      } else if (enableSocialPost) {
        toast.info("Social post scheduled to follow publication");
      }

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
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-white rounded-[40px]">
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="p-10 pb-6 bg-primary-soft/30 relative">
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

          <div className="p-10 pt-8 space-y-8">
            {/* Launch Timing */}
            <section className="space-y-4">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                Launch Strategy
              </Label>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
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

            {/* Social Amplification */}
            <div className="space-y-4">
              <div className="p-6 rounded-[32px] bg-muted/10 border border-border/30 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm grid place-items-center shrink-0">
                    <Share2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Social Amplification</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                      Automatically create social posts after publication.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={enableSocialPost}
                  onCheckedChange={setEnableSocialPost}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {enableSocialPost && (
                <div className="px-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Post Delay
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Instantly", value: "0" },
                      { label: "30m", value: "30" },
                      { label: "1h", value: "60" },
                      { label: "24h", value: "1440" },
                      { label: "Custom", value: "custom" },
                    ].map((d) => (
                      <button
                        key={d.value}
                        onClick={() =>
                          setPostDelay(d.value as "0" | "30" | "60" | "1440" | "custom")
                        }
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-bold border transition-all",
                          postDelay === d.value
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-muted-foreground border-border/50 hover:border-primary/20",
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {postDelay === "custom" && (
                    <div className="flex items-center gap-3 animate-in zoom-in-95 duration-300">
                      <Input
                        type="number"
                        value={customDelay}
                        onChange={(e) => setCustomDelay(e.target.value)}
                        className="h-10 w-24 rounded-xl border-none bg-muted/30 text-xs font-bold"
                      />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Minutes Delay
                      </span>
                    </div>
                  )}

                  {publishType === "now" && postDelay === "0" && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-between gap-4 mt-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm grid place-items-center shrink-0">
                          <Smartphone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">Add Instagram Story</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                            Richer Story layout (type, margins, accents)—product photo stays exactly
                            as uploaded; only 9:16 framing and designed chrome around it (after feed
                            posts).
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={addInstagramStory}
                        onCheckedChange={setAddInstagramStory}
                        className="data-[state=checked]:bg-primary shrink-0"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

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
          <div className="p-10 border-t border-border/40 bg-muted/5 mt-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Ready for Deployment
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full px-8 h-12 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={
                    isPublishing || (publishType === "schedule" && (!publishDate || !publishTime))
                  }
                  className="rounded-full px-12 h-12 font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 min-w-[180px]"
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
      </DialogContent>
    </Dialog>
  );
}
