import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Copy,
  Instagram,
  Facebook,
  Twitter,
  MessageSquare,
  Sparkles,
  X,
  CheckCircle2,
  Link2,
  Share2,
  Loader2,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  publishViaManus,
  type PublishViaManusInput,
  type PublishViaManusResult,
} from "@/lib/manus-server";
import { formatPkr } from "@/lib/format-currency";
import { pushAdminNotification } from "@/lib/admin-notifications-bus";

interface SocialPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image_url?: string;
    image?: string;
  };
}

type Platform = "Instagram" | "Facebook" | "X" | "TikTok";

export function SocialPostModal({ open, onOpenChange, product }: SocialPostModalProps) {
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [caption, setCaption] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [addInstagramStory, setAddInstagramStory] = useState(false);

  const productImg = product.image_url || product.image;

  const manusSupports = (p: Platform): p is "Instagram" | "Facebook" =>
    p === "Instagram" || p === "Facebook";

  const handleDirectPost = async () => {
    if (manusSupports(platform)) {
      if (!productImg || !productImg.startsWith("http")) {
        toast.error("Product image must be a public URL to publish via Manus AI.");
        return;
      }

      setIsPublishing(true);
      try {
        const captionWithLink = `${caption}\n\n${trackingUrl}`;
        const basePayload = {
          imageUrl: productImg,
          caption: captionWithLink,
          productId: product.id,
        };

        const feedResult = await (
          publishViaManus as unknown as (payload: {
            data: PublishViaManusInput;
          }) => Promise<PublishViaManusResult>
        )({
          data: {
            ...basePayload,
            platform: platform.toLowerCase() as "instagram" | "facebook",
            placement: "feed",
          },
        });

        if (!feedResult?.ok) {
          toast.error(`Manus publish failed: ${feedResult?.error ?? "Unknown error"}`);
          return;
        }

        toast.success(
          feedResult.postUrl
            ? `Posted to ${platform}: ${feedResult.postUrl}`
            : `Posted to ${platform} via Manus AI`,
        );

        const feedLabel = platform === "Instagram" ? "Instagram" : "Facebook";
        pushAdminNotification({
          id: `manus-feed-studio-${product.id}-${feedLabel}-${Date.now()}`,
          type: "social_feed",
          message: `${feedLabel} post uploaded`,
          description: feedResult.postUrl
            ? `${product.name} — ${feedResult.postUrl}`
            : `${product.name} was published to ${feedLabel}.`,
          timestamp: new Date(),
        });

        if (platform === "Instagram" && addInstagramStory) {
          const storyResult = await (
            publishViaManus as unknown as (payload: {
              data: PublishViaManusInput;
            }) => Promise<PublishViaManusResult>
          )({
            data: {
              ...basePayload,
              platform: "instagram",
              placement: "story",
            },
          });
          if (storyResult?.ok) {
            toast.success(
              storyResult.postUrl
                ? `Instagram Story: ${storyResult.postUrl}`
                : storyResult.storyDesignSummary
                  ? `Story live — ${storyResult.storyDesignSummary}`
                  : "Instagram Story published via Manus",
            );
            pushAdminNotification({
              id: `manus-story-studio-${product.id}-${Date.now()}`,
              type: "social_story",
              message: "Instagram Story uploaded",
              description: storyResult.postUrl
                ? `${product.name} — ${storyResult.postUrl}`
                : storyResult.storyDesignSummary
                  ? `${product.name}. ${storyResult.storyDesignSummary}`
                  : `${product.name} is live on your Story.`,
              timestamp: new Date(),
            });
          } else {
            toast.error(`Instagram Story failed: ${storyResult?.error ?? "Unknown error"}`);
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(`Manus error: ${error?.message ?? "Unknown error"}`);
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    const urls: Record<Platform, string> = {
      Instagram: "https://www.instagram.com/",
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackingUrl)}&quote=${encodeURIComponent(caption)}`,
      X: `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(trackingUrl)}`,
      TikTok: "https://www.tiktok.com/upload",
    };
    window.open(urls[platform], "_blank");
    toast.info(`Opening ${platform} composer (Manus connector not configured for ${platform}).`);
  };

  const generateContent = useCallback(() => {
    const baseUrl = `${window.location.origin}/product/${product.id}`;
    const utm = `utm_source=${platform.toLowerCase()}&utm_medium=social&utm_campaign=product_share`;
    const finalUrl = `${baseUrl}?${utm}`;
    setTrackingUrl(finalUrl);

    const captions: Record<Platform, string> = {
      Instagram: `✨ Pure elegance for your little one. Our ${product.name} is a masterpiece of comfort and style. 🕊️\n\nShop the collection now. Only ${formatPkr(Number(product.price))}.\n\nLink in bio! 🎀\n\n#LittleLuxuries #BabyFashion #LuxuryLiving #OrganicCotton`,
      Facebook: `Discover the heirloom quality of the ${product.name}. Crafted with the softest materials for delicate skin, it's the perfect addition to your nursery collection. 🍼✨\n\nPrice: ${formatPkr(Number(product.price))}\nShop here: ${finalUrl}\n\n#LittleLuxuries #BabyStyle #NurseryEssentials`,
      X: `Elevate their first wardrobe with the ${product.name}. Sophistication meets comfort in every stitch. 🧵✨\n\nShop now: ${finalUrl}\n\n#LuxuryBaby #LittleLuxuries #Style`,
      TikTok: `The ${product.name} is here and it's everything! ☁️✨ Pure luxury for your mini-me. \n\nCheck the link to shop! 🛍️\n\n#LittleLuxuries #BabyRegistry #AestheticBaby`,
    };

    setCaption(captions[platform]);
  }, [product, platform]);

  useEffect(() => {
    generateContent();
  }, [generateContent]);

  useEffect(() => {
    if (platform !== "Instagram") setAddInstagramStory(false);
  }, [platform]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${caption}\n\nLink: ${trackingUrl}`);
    setIsCopied(true);
    toast.success(`${platform} post copied to clipboard`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto md:overflow-hidden border-none shadow-2xl bg-white rounded-[32px] md:rounded-[40px] max-h-[95vh] h-auto md:h-[90vh] flex flex-col">
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
          {/* Left: Preview */}
          <div className="w-full md:w-[380px] bg-muted/20 border-b md:border-b-0 md:border-r border-border/50 p-6 md:p-10 flex flex-col gap-6 shrink-0 md:overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 text-center">
                Post Preview
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium text-center italic">
                How it might look on {platform}
              </p>
            </div>

            <div className="bg-white rounded-[32px] shadow-2xl border border-border/50 overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center text-primary font-bold text-[10px]">
                  LL
                </div>
                <div className="text-[10px] font-bold text-foreground">littleluxuries_official</div>
              </div>

              <div className="aspect-square bg-muted/30">
                <img src={productImg} alt={product.name} className="w-full h-full object-cover" />
              </div>

              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <Send className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] leading-relaxed line-clamp-3">
                    <span className="font-bold mr-2">littleluxuries_official</span>
                    {caption}
                  </p>
                  <p className="text-[9px] text-primary font-medium">{trackingUrl}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-border/50 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">
                    AI Caption Generated
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Optimized for high engagement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="flex-1 flex flex-col bg-white md:overflow-hidden">
            <div className="p-6 pb-4 md:p-10 md:pb-6 border-b border-border/30 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-serif text-primary tracking-tight">
                  Post Studio
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-medium">
                  Craft the perfect social presence for {product.name}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-10 w-10 hover:bg-muted/80"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 md:overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-10 custom-scrollbar">
              <section className="space-y-4">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                  Target Platform
                </Label>
                <div className="flex gap-3">
                  {[
                    { id: "Instagram", icon: Instagram },
                    { id: "Facebook", icon: Facebook },
                    { id: "X", icon: Twitter },
                    { id: "TikTok", icon: MessageSquare },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id as Platform)}
                      className={cn(
                        "flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group",
                        platform === p.id
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                          : "bg-white text-muted-foreground border-border/50 hover:border-primary/30",
                      )}
                    >
                      <p.icon
                        className={cn(
                          "h-6 w-6",
                          platform === p.id
                            ? "text-white"
                            : "text-primary/40 group-hover:text-primary",
                        )}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">
                        {p.id}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                    Caption Editor
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateContent}
                    className="h-7 text-[10px] font-bold text-primary px-2"
                  >
                    <Sparkles className="h-3 w-3 mr-1.5" /> Regenerate
                  </Button>
                </div>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[180px] rounded-[24px] bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 p-6 text-sm leading-relaxed custom-scrollbar"
                />
              </section>

              <section className="space-y-4 pt-4">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                  Tracking Attribution
                </Label>
                <div className="relative">
                  <div className="w-full bg-muted/10 p-4 rounded-2xl pr-14 break-all text-[10px] font-mono text-muted-foreground border border-border/30 flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                    {trackingUrl}
                  </div>
                </div>
              </section>

              {platform === "Instagram" && (
                <section className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-white shadow-sm grid place-items-center shrink-0">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-foreground">Add Instagram Story</p>
                        <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">
                          After the feed post: a more designed Story—typography, margins, and
                          accents—product image unchanged.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={addInstagramStory}
                      onCheckedChange={setAddInstagramStory}
                      className="data-[state=checked]:bg-primary shrink-0"
                    />
                  </div>
                </section>
              )}
            </div>

            <div className="p-6 md:p-10 border-t border-border/40 bg-muted/5 mt-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="rounded-full h-14 px-8 font-bold border-primary/20 hover:border-primary/40 text-primary w-full sm:w-auto shrink-0"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" /> Copy Content
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDirectPost}
                  disabled={isPublishing}
                  className="rounded-full h-14 flex-1 font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 w-full sm:w-auto"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing via Manus…
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      {manusSupports(platform)
                        ? `Publish to ${platform} via Manus`
                        : `Open ${platform} Composer`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Icons for the preview
function Heart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
function Send({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
