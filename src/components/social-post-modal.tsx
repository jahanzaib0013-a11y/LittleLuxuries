import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Instagram,
  Facebook,
  MessageSquare,
  Sparkles,
  X,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Share2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { fullScreenModalClass } from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { cn } from "@/lib/utils";
import { formatPkr } from "@/lib/format-currency";
import {
  buildFacebookShareUrl,
  buildWhatsAppShareUrl,
  downloadImage,
  shareWithNativeSheet,
  canShareFiles,
  fetchImageAsFile,
} from "@/lib/social-share";

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

type PlatformId = "instagram" | "facebook" | "whatsapp" | "tiktok";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type ContentPass = "full" | "partial" | "native" | "manual";

type PlatformPost = {
  id: PlatformId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  caption: string;
  trackingUrl: string;
  copyText: string;
  openUrl: string;
  openLabel: string;
  tip: string;
  charCount: number;
  contentPass: ContentPass;
  passSummary: string;
};

const PLATFORMS: Array<{
  id: PlatformId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  utmSource: string;
}> = [
  { id: "instagram", label: "Instagram", icon: Instagram, utmSource: "instagram" },
  { id: "facebook", label: "Facebook", icon: Facebook, utmSource: "facebook" },
  { id: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, utmSource: "whatsapp" },
  { id: "tiktok", label: "TikTok", icon: MessageSquare, utmSource: "tiktok" },
];

function buildPlatformPosts(product: SocialPostModalProps["product"]): PlatformPost[] {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://littleluxuries.pk";
  const price = formatPkr(Number(product.price));
  const shortDesc =
    product.description?.trim().slice(0, 120) ||
    "Crafted for comfort and timeless style.";

  return PLATFORMS.map(({ id, label, icon, utmSource }) => {
    const trackingUrl = `${origin}/product/${product.id}?utm_source=${utmSource}&utm_medium=social&utm_campaign=product_share`;

    const captions: Record<PlatformId, string> = {
      instagram: `✨ ${product.name}\n\n${shortDesc}\n\n${price} · Link in bio 🎀\n\n#LittleLuxuries #BabyFashion #LuxuryLiving #OrganicCotton`,
      facebook: `${product.name} — ${shortDesc}\n\n${price}\n\n#LittleLuxuries #BabyStyle #NurseryEssentials`,
      whatsapp: `✨ *${product.name}*\n${shortDesc}\n\n💰 ${price}\n\n_Little Luxuries — luxury for your little one_`,
      tiktok: `${product.name} ☁️✨ ${price}\n\n${shortDesc}\n\n#LittleLuxuries #BabyRegistry #AestheticBaby`,
    };

    const caption = captions[id];
    const copyText =
      id === "instagram"
        ? `${caption}\n\n🔗 Product page (for bio / link sticker):\n${trackingUrl}`
        : `${caption}\n\n${trackingUrl}`;

    const meta: Record<
      PlatformId,
      { openUrl: string; openLabel: string; tip: string; contentPass: ContentPass; passSummary: string }
    > = {
      instagram: {
        openUrl: "https://www.instagram.com/",
        openLabel: "Open Instagram",
        contentPass: "native",
        passSummary: "Caption copied · use Share with image on phone to pass photo + text",
        tip: "On mobile: Share with image opens the system sheet (pick Instagram). Caption is copied automatically. Desktop: paste caption after upload.",
      },
      facebook: {
        openUrl: buildFacebookShareUrl(trackingUrl, `${caption}\n\n${trackingUrl}`),
        openLabel: "Open Facebook with link + caption",
        contentPass: "partial",
        passSummary: "Passes product link + quote text · preview image from your product page",
        tip: "Opens Facebook share with your link and caption pre-filled. Image preview uses your live product page OG tags.",
      },
      whatsapp: {
        openUrl: buildWhatsAppShareUrl(copyText),
        openLabel: "Open WhatsApp with message",
        contentPass: "native",
        passSummary: "Message + link in WhatsApp · use Share with image for Status",
        tip: "Opens WhatsApp with caption + link ready to send. For Status: on phone tap Share with image + caption, pick WhatsApp, then add to My Status. Desktop: forward the message to Status after sending to yourself.",
      },
      tiktok: {
        openUrl: "https://www.tiktok.com/upload",
        openLabel: "Open TikTok upload",
        contentPass: "native",
        passSummary: "Caption copied · Share with image on phone can pass photo + text",
        tip: "On mobile: Share with image → choose TikTok. Caption copied to clipboard for the description field.",
      },
    };

    const m = meta[id];

    return {
      id,
      label,
      icon,
      caption,
      trackingUrl,
      copyText,
      openUrl: m.openUrl,
      openLabel: m.openLabel,
      tip: m.tip,
      charCount: caption.length,
      contentPass: m.contentPass,
      passSummary: m.passSummary,
    };
  });
}

export function SocialPostModal({ open, onOpenChange, product }: SocialPostModalProps) {
  const [selectedId, setSelectedId] = useState<PlatformId>("instagram");
  const [copiedId, setCopiedId] = useState<PlatformId | null>(null);
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [nativeImageShare, setNativeImageShare] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const productImg = product.image_url || product.image;
  const isPublicImage = Boolean(productImg?.startsWith("http"));

  const refreshPosts = useCallback(() => {
    setPosts(buildPlatformPosts(product));
  }, [product]);

  useEffect(() => {
    if (open) refreshPosts();
  }, [open, refreshPosts]);

  useEffect(() => {
    if (!open || !isPublicImage || !productImg) {
      setNativeImageShare(false);
      return;
    }
    void fetchImageAsFile(productImg, product.name).then(async (file) => {
      setNativeImageShare(file ? await canShareFiles([file]) : false);
    });
  }, [open, isPublicImage, productImg, product.name]);

  const selected = useMemo(
    () => posts.find((p) => p.id === selectedId) ?? posts[0],
    [posts, selectedId],
  );

  const handleCopy = async (post: PlatformPost) => {
    await navigator.clipboard.writeText(post.copyText);
    setCopiedId(post.id);
    toast.success(`${post.label} post copied`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyImageUrl = async () => {
    if (!productImg) {
      toast.error("No product image to copy.");
      return;
    }
    await navigator.clipboard.writeText(productImg);
    toast.success("Image URL copied");
  };

  const handleDownloadImage = async () => {
    if (!productImg) {
      toast.error("No product image available.");
      return;
    }
    const ok = await downloadImage(productImg, product.name);
    toast.success(ok ? "Image downloaded — attach when posting" : "Opened image in a new tab");
  };

  const handleNativeShare = async (post: PlatformPost) => {
    if (!productImg?.startsWith("http")) {
      toast.error("Image must be a public URL to share with photo.");
      return;
    }
    setIsSharing(true);
    await navigator.clipboard.writeText(post.copyText);
    const result = await shareWithNativeSheet({
      title: product.name,
      text: post.copyText,
      url: post.trackingUrl,
      imageUrl: productImg,
    });
    setIsSharing(false);
    if (result === "shared") {
      toast.success("Pick WhatsApp, Instagram, or another app — caption already copied too");
    } else if (result === "aborted") {
      return;
    } else {
      toast.info("Native share unavailable — use Open platform instead");
    }
  };

  /** Copy caption, then open deep link or native share where possible */
  const handleOpenWithContent = async (post: PlatformPost) => {
    await navigator.clipboard.writeText(post.copyText);

    if (
      (post.id === "instagram" || post.id === "tiktok" || post.id === "whatsapp") &&
      nativeImageShare &&
      isPublicImage
    ) {
      setIsSharing(true);
      const result = await shareWithNativeSheet({
        title: product.name,
        text: post.copyText,
        url: post.trackingUrl,
        imageUrl: productImg,
      });
      setIsSharing(false);
      if (result === "shared") {
        toast.success(`${post.label}: caption copied · image shared via system sheet`);
        return;
      }
      if (result === "aborted") return;
    }

    window.open(post.openUrl, "_blank", "noopener,noreferrer");
    toast.success(`${post.label}: ${post.passSummary}`, { duration: 5000 });
  };

  if (!selected) return null;

  const passBadge =
    selected.contentPass === "full"
        ? "Text + link auto-filled"
      : selected.contentPass === "partial"
        ? "Link + caption passed"
        : selected.contentPass === "native"
          ? selected.id === "whatsapp"
            ? "Message or Status via share sheet"
            : "Use Share with image (mobile)"
          : "Copy + paste";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={fullScreenModalClass}>
        <ModalCloseBar onClose={() => onOpenChange(false)} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/40 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            {productImg && (
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-muted">
                <img src={productImg} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <DialogTitle className="font-serif text-2xl text-primary tracking-tight">
                Quick post kit
              </DialogTitle>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {product.name} · {formatPkr(Number(product.price))}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden rounded-full text-xs font-bold sm:inline-flex"
              onClick={refreshPosts}
            >
              <Sparkles className="mr-1.5 size-3.5" />
              Refresh copy
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
              <X className="size-5" />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="shrink-0 border-b border-border/40 bg-muted/15 p-4 lg:w-52 lg:border-b-0 lg:border-r">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
              Platforms
            </p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {posts.map((post) => {
                const Icon = post.icon;
                const active = selectedId === post.id;
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedId(post.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition-all",
                      active
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                        : "border-border/50 bg-white hover:border-primary/30",
                    )}
                  >
                    <Icon className={cn("size-5 shrink-0", active ? "text-white" : "text-primary")} />
                    <div className="min-w-0">
                      <span className="block text-[11px] font-bold">{post.label}</span>
                      <span
                        className={cn(
                          "text-[9px]",
                          active ? "text-white/80" : "text-muted-foreground",
                        )}
                      >
                        {post.charCount} chars
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            {productImg && (
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full text-[10px] font-bold"
                  onClick={handleDownloadImage}
                >
                  <Download className="mr-1.5 size-3.5" />
                  Download image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full text-[10px] font-bold"
                  onClick={handleCopyImageUrl}
                >
                  <ImageIcon className="mr-1.5 size-3.5" />
                  Copy image URL
                </Button>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <selected.icon className="size-5 text-primary" />
                  <h3 className="font-serif text-xl text-foreground">{selected.label} post</h3>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-700">
                  {passBadge}
                </span>
              </div>

              <p className="mb-2 text-xs font-medium text-foreground/80">{selected.passSummary}</p>
              <p className="mb-4 text-xs text-muted-foreground leading-relaxed">{selected.tip}</p>

              <div className="rounded-[24px] border border-border/50 bg-muted/10 overflow-hidden">
                <div className="border-b border-border/40 bg-white/80 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Caption (auto-copied when you open / share)
                  </p>
                </div>
                <pre className="whitespace-pre-wrap break-words p-5 font-sans text-sm leading-relaxed text-foreground">
                  {selected.caption}
                </pre>
                <div className="border-t border-border/40 bg-white/80 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Tracking link
                  </p>
                </div>
                <p className="break-all px-5 pb-5 font-mono text-[11px] text-primary">
                  {selected.trackingUrl}
                </p>
              </div>

              {!isPublicImage && productImg && (
                <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-xs text-amber-900">
                  Image is not a public http(s) URL — download it or use Supabase public storage so
                  Facebook preview and mobile share can include the photo.
                </p>
              )}
            </div>

            <div className="shrink-0 border-t border-border/40 bg-muted/5 p-6 md:px-8">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => handleOpenWithContent(selected)}
                  disabled={isSharing}
                  className="h-12 w-full rounded-full font-bold bg-primary shadow-lg shadow-primary/25"
                >
                  {isSharing ? (
                    "Opening share…"
                  ) : (
                    <>
                      <ExternalLink className="mr-2 size-4" />
                      {selected.openLabel}
                    </>
                  )}
                </Button>

                {nativeImageShare && isPublicImage && (
                  <Button
                    variant="secondary"
                    onClick={() => handleNativeShare(selected)}
                    disabled={isSharing}
                    className="h-12 w-full rounded-full font-bold"
                  >
                    <Share2 className="mr-2 size-4" />
                    Share with image + caption (phone)
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => handleCopy(selected)}
                  className="h-11 w-full rounded-full font-bold border-primary/25 text-primary"
                >
                  {copiedId === selected.id ? (
                    <>
                      <CheckCircle2 className="mr-2 size-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 size-4" />
                      Copy only
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-3 text-center text-[10px] text-muted-foreground leading-relaxed">
                We always copy the caption first. Facebook &amp; WhatsApp open with your message.
                Instagram, TikTok &amp; WhatsApp Status work best via Share with image on your phone.
              </p>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
