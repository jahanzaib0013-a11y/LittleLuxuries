/** Helpers for passing caption/link/image into platform share flows (best-effort). */

export async function fetchImageAsFile(
  imageUrl: string,
  baseName: string,
): Promise<File | null> {
  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = blob.type?.includes("png") ? "png" : "jpg";
    const safeName = baseName.replace(/[^\w-]+/g, "-").slice(0, 48) || "product";
    return new File([blob], `${safeName}.${ext}`, {
      type: blob.type || "image/jpeg",
    });
  } catch {
    return null;
  }
}

export async function canShareFiles(files: File[]): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

export async function shareWithNativeSheet(opts: {
  title: string;
  text: string;
  url?: string;
  imageUrl?: string;
}): Promise<"shared" | "unsupported" | "aborted" | "failed"> {
  if (!navigator.share) return "unsupported";

  const files: File[] = [];
  if (opts.imageUrl) {
    const file = await fetchImageAsFile(opts.imageUrl, opts.title);
    if (file && (await canShareFiles([file]))) {
      files.push(file);
    }
  }

  const payload: ShareData = {
    title: opts.title,
    text: opts.text,
    url: opts.url,
  };
  if (files.length > 0) {
    (payload as ShareData & { files?: File[] }).files = files;
  }

  try {
    if (files.length > 0 && navigator.canShare && !navigator.canShare(payload)) {
      return "unsupported";
    }
    await navigator.share(payload);
    return "shared";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "aborted";
    return "failed";
  }
}

export function truncateForTweet(text: string, max = 275): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function buildFacebookShareUrl(pageUrl: string, quote: string): string {
  const params = new URLSearchParams({
    u: pageUrl,
    quote,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function buildXIntentUrl(text: string): string {
  const params = new URLSearchParams({ text: truncateForTweet(text) });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function downloadImage(imageUrl: string, filename: string): Promise<boolean> {
  try {
    const file = await fetchImageAsFile(imageUrl, filename);
    if (!file) {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
      return false;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
