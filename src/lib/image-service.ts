import { supabase } from "./supabase";

/**
 * Resize + re-encode an image entirely in the browser before upload.
 *
 * On the Supabase Free plan we can't transform/resize on the server, so the
 * only way to avoid shipping multi-MB originals to every visitor is to shrink
 * them once, at upload time. We cap the longest edge at MAX_EDGE and re-encode
 * to WebP, which typically cuts file size by ~70-85% with no visible loss.
 * If anything goes wrong (e.g. an unsupported file), we fall back to the
 * original file so uploads never break.
 */
const MAX_EDGE = 1400;
const WEBP_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  // Only attempt to compress raster images the browser can decode.
  if (typeof document === "undefined" || !file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    // If compression didn't actually help, keep the original.
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch (error) {
    console.warn("Image compression skipped:", error);
    return file;
  }
}

export const imageService = {
  // Upload image to Supabase Storage
  async uploadImage(file: File, folder: string = "products"): Promise<string> {
    try {
      // Shrink + re-encode before upload (see compressImage).
      const optimized = await compressImage(file);

      // Generate unique file name
      const fileExt = optimized.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file to Supabase Storage. Cache for 1 year — storage objects are
      // immutable (unique filename per upload), so they can be cached forever.
      const { error } = await supabase.storage
        .from("product-images")
        .upload(filePath, optimized, {
          cacheControl: "31536000",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        throw new Error("Failed to upload image");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  },

  // Delete image from Supabase Storage
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const filePath = url.pathname.split("/").pop();

      if (!filePath) return;

      const { error } = await supabase.storage
        .from("product-images")
        .remove([`products/${filePath}`]);

      if (error) {
        console.error("Delete error:", error);
        throw new Error("Failed to delete image");
      }
    } catch (error) {
      console.error("Image delete error:", error);
      throw error;
    }
  },
};
