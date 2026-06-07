import { supabase } from "./supabase";

export const imageService = {
  // Upload image to Supabase Storage
  async uploadImage(file: File, folder: string = "products"): Promise<string> {
    try {
      // Generate unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
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
