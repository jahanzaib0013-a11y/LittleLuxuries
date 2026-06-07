import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { imageService } from "@/lib/image-service";
import { blogService, slugify, type Blog } from "@/lib/blog-service";
import { fullScreenModalClass, modalFooterClass } from "@/components/product-modal-layout";
import { cn, isUsableImageUrl } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog?: Blog | null;
  onSaved?: () => void;
};

const labelClass = "text-[11px] font-bold uppercase tracking-[0.18em] text-primary/60";
const fieldClass = "mt-1.5 rounded-xl border-border bg-card";

export function BlogEditorModal({ open, onOpenChange, blog, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(blog?.title ?? "");
    setSlug(blog?.slug ?? "");
    setSlugEdited(Boolean(blog?.slug));
    setExcerpt(blog?.excerpt ?? "");
    setBody(blog?.body ?? "");
    setCoverImage(blog?.cover_image_url ?? null);
    setVideoUrl(blog?.video_url ?? "");
    setStatus((blog?.status as "draft" | "published") ?? "draft");
  }, [open, blog]);

  const onTitle = (v: string) => {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setUploading(true);
    try {
      const url = await imageService.uploadImage(file, "blogs");
      setCoverImage(url);
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const finalSlug = (slug.trim() || slugify(title)).trim();
    if (!finalSlug) {
      toast.error("Slug is required");
      return;
    }
    setSaving(true);
    try {
      const nowPublishing = status === "published";
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        body,
        cover_image_url: coverImage,
        video_url: videoUrl.trim() || null,
        status,
        // Stamp published_at the first time it goes live; keep existing otherwise.
        published_at:
          nowPublishing && !blog?.published_at
            ? new Date().toISOString()
            : (blog?.published_at ?? null),
      };
      const result = blog
        ? await blogService.updateBlog(blog.id, payload)
        : await blogService.createBlog(payload);
      if (!result) {
        toast.error("Couldn't save the post (is the slug unique?).");
        return;
      }
      toast.success(blog ? "Post updated" : "Post created");
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={fullScreenModalClass}>
        <div className="flex items-start justify-between gap-3 border-b border-border/40 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
          <div>
            <DialogTitle className="font-serif text-xl text-primary sm:text-2xl">
              {blog ? "Edit post" : "New post"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Write a journal entry for your storefront.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 custom-scrollbar">
          <div>
            <label className={labelClass}>Title</label>
            <Input
              value={title}
              onChange={(e) => onTitle(e.target.value)}
              placeholder="A gentle guide to newborn layering"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Slug (URL)</label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugEdited(true);
              }}
              placeholder="newborn-layering-guide"
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">/blog/{slug || "your-post"}</p>
          </div>

          <div>
            <label className={labelClass}>Cover image</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 flex aspect-[16/7] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/20 bg-muted/20 transition-colors hover:border-primary/40"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : isUsableImageUrl(coverImage) ? (
                <img src={coverImage!} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImagePlus className="h-5 w-5" /> Upload cover
                </span>
              )}
            </button>
            {isUsableImageUrl(coverImage) && (
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="mt-2 text-xs font-medium text-destructive hover:underline"
              >
                Remove cover
              </button>
            )}
          </div>

          <div>
            <label className={labelClass}>Video (optional)</label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube, Vimeo, or .mp4 link"
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Paste a video link — it'll play at the top of the article.
            </p>
          </div>

          <div>
            <label className={labelClass}>Excerpt</label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="A short summary shown on the blog listing."
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Body</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Write your post… Leave a blank line between paragraphs."
              className={cn(fieldClass, "min-h-[260px] leading-relaxed")}
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <div className="mt-1.5 flex gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors",
                    status === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={modalFooterClass}>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full sm:px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || uploading}
              className="rounded-full bg-primary sm:px-8"
            >
              {saving ? "Saving…" : blog ? "Save changes" : "Create post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
