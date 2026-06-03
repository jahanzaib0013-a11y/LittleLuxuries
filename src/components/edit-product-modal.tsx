import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Upload,
  ImageIcon,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
  Trash2,
  Wand2,
  Save,
} from "lucide-react";
import {
  generateLuxuryNarrative,
  generateSustainabilityPromise,
  generateCareInstructions,
} from "@/lib/luxury-engine";
import { productService } from "@/lib/supabase-service";
import { imageService } from "@/lib/image-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type Database } from "@/lib/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Database["public"]["Tables"]["products"]["Row"];
  onProductUpdated?: () => void;
  onSuccess?: (product: Database["public"]["Tables"]["products"]["Row"]) => void;
}

interface ProductFormData {
  name: string;
  price: string;
  category: string;
  variant: string;
  badge: string;
  description: string;
  sizes: string[];
  image_url: string;
  secondary_images: string[];
  sustainability: string;
  care_instructions: string;
  gender: string;
  units: string;
}

const categories = ["Onesies", "Sleepwear", "Knitwear", "Accessories", "Gift Sets"];

const badgeOptions = ["New", "Bestseller", "Low stock", "Limited edition", "Sale"];

const sizeOptions = ["Newborn", "0–3M", "3–6M", "6–12M", "12–18M", "18–24M", "One Size"];

export function EditProductModal({
  open,
  onOpenChange,
  product,
  onProductUpdated,
}: EditProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    category: "",
    variant: "",
    badge: "",
    description: "",
    sizes: [],
    image_url: "",
    secondary_images: [],
    sustainability: "",
    care_instructions: "",
    gender: "unisex",
    units: "0",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [secondaryPreviews, setSecondaryPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || "",
        price: product.price?.toString() || "",
        category: product.category || "",
        variant: product.variant || "",
        badge: product.badge || "",
        description: product.description || "",
        sizes: product.sizes || [],
        image_url: product.image_url || "",
        secondary_images: product.secondary_images || [],
        sustainability: product.sustainability || "",
        care_instructions: product.care_instructions || "",
        gender: product.gender || "unisex",
        units: product.units?.toString() || "0",
      });
      setImagePreview(product.image_url || null);
      setSecondaryPreviews(product.secondary_images || []);
    }
  }, [product, open]);

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSizeToggle = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setIsUploading(true);

      try {
        const imageUrl = await imageService.uploadImage(file);
        setFormData((prev) => ({ ...prev, image_url: imageUrl }));
        toast.success("Main image updated");
      } catch (error) {
        toast.error("Failed to update main image");
        setImagePreview(product?.image_url || null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSecondaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.secondary_images.length + files.length > 5) {
      toast.error("Maximum 5 secondary images allowed");
      return;
    }

    setIsUploading(true);
    const newPreviews = [...secondaryPreviews];
    const uploadedUrls = [...formData.secondary_images];

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);
        setSecondaryPreviews([...newPreviews]);

        const imageUrl = await imageService.uploadImage(file);
        uploadedUrls.push(imageUrl);
        setFormData((prev) => ({ ...prev, secondary_images: [...uploadedUrls] }));
      }
      toast.success(`${files.length} image(s) added`);
    } catch (error) {
      toast.error("Error uploading some images");
    } finally {
      setIsUploading(false);
    }
  };

  const removeSecondaryImage = (index: number) => {
    const newPreviews = [...secondaryPreviews];
    const newUrls = [...formData.secondary_images];

    if (newPreviews[index].startsWith("blob:")) {
      URL.revokeObjectURL(newPreviews[index]);
    }

    newPreviews.splice(index, 1);
    newUrls.splice(index, 1);

    setSecondaryPreviews(newPreviews);
    setFormData((prev) => ({ ...prev, secondary_images: newUrls }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category || !formData.image_url) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.secondary_images.length < 2) {
      toast.error("Luxury products require at least 2 gallery images");
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        variant: formData.variant,
        badge: formData.badge === "none" ? undefined : formData.badge,
        description: formData.description,
        sizes: formData.sizes,
        image_url: formData.image_url,
        secondary_images: formData.secondary_images,
        sustainability: formData.sustainability,
        care_instructions: formData.care_instructions,
        gender: formData.gender,
        units: parseInt(formData.units) || 0,
      };

      const result = await productService.updateProduct(product.id, productData);

      if (result) {
        toast.success("Product updated successfully!");
        onProductUpdated?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred while updating the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-full lg:max-w-5xl p-0 overflow-hidden border-none shadow-2xl bg-white rounded-[40px] h-[90vh] flex flex-col">
        <div className="flex flex-1 w-full overflow-hidden">
          {/* Left Column: Media Workspace */}
          <div className="w-[400px] bg-muted/20 border-r border-border/50 p-10 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                    Primary View
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                    Current
                  </span>
                </div>
                <div
                  className={cn(
                    "relative aspect-square rounded-[32px] overflow-hidden border-2 border-dashed border-primary/10 bg-white transition-all duration-500 shadow-sm",
                    imagePreview && "border-none shadow-xl scale-[1.02]",
                  )}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover animate-in fade-in zoom-in duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60">
                      <ImageIcon className="h-10 w-10 mb-3 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No Image</p>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl border-primary/20 hover:border-primary/40 h-12 font-semibold text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Update Main Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                    Secondary Gallery
                  </h3>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      formData.secondary_images.length < 2
                        ? "text-amber-600 bg-amber-50"
                        : "text-emerald-600 bg-emerald-50",
                    )}
                  >
                    {formData.secondary_images.length}/5 Images
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {secondaryPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-2xl overflow-hidden group shadow-md border border-border/50 bg-white"
                    >
                      <img
                        src={preview}
                        alt={`Gallery ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeSecondaryImage(idx)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash2 className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  ))}

                  {formData.secondary_images.length < 5 && (
                    <button
                      onClick={() => secondaryInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-primary/10 bg-white hover:bg-primary-soft/10 hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <ImagePlus className="h-6 w-6 text-primary/40 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-primary/40 uppercase tracking-tighter">
                        Add More
                      </span>
                    </button>
                  )}
                </div>
                <input
                  ref={secondaryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSecondaryUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Configuration Workspace */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="p-10 pb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-4xl font-serif text-primary tracking-tight">
                    Edit Luxury Suite
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Refining the narrative and details for {product?.name}.
                    </p>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-border/50",
                        product?.status === "published"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : product?.status === "scheduled"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {product?.status || "Draft"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="rounded-full hover:bg-muted/80"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 pt-4 space-y-12 custom-scrollbar">
              <form id="edit-luxury-product" onSubmit={handleSubmit} className="space-y-12">
                {/* 1. Core Identity */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                      Product Title
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Product Title"
                      className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 text-lg font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                      Boutique price (PKR)
                    </Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0.00"
                      className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 text-lg font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                      Gender / Classification
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(v) => handleInputChange("gender", v)}
                    >
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="unisex" className="rounded-xl py-3">
                          Unisex
                        </SelectItem>
                        <SelectItem value="boy" className="rounded-xl py-3">
                          Boy
                        </SelectItem>
                        <SelectItem value="girl" className="rounded-xl py-3">
                          Girl
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleInputChange("category", v)}
                    >
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {categories.map((c) => (
                          <SelectItem key={c} value={c} className="rounded-xl py-3">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                      Status Indicator
                    </Label>
                    <Select
                      value={formData.badge}
                      onValueChange={(v) => handleInputChange("badge", v)}
                    >
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="No Badge" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="none" className="rounded-xl py-3 italic">
                          Standard Listing
                        </SelectItem>
                        {badgeOptions.map((b) => (
                          <SelectItem
                            key={b}
                            value={b}
                            className="rounded-xl py-3 font-bold text-primary"
                          >
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 2. Brand Narrative */}
                <div className="space-y-6 bg-muted/10 p-8 rounded-[32px] border border-border/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                      <Sparkles className="h-4 w-4" />
                      Premium Content
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleInputChange(
                          "description",
                          generateLuxuryNarrative(formData.name || "this piece", formData.category),
                        );
                        handleInputChange("sustainability", generateSustainabilityPromise());
                        handleInputChange("care_instructions", generateCareInstructions());
                        toast.success("Luxury narrative synchronized");
                      }}
                      className="h-8 text-[10px] font-bold text-primary px-3 bg-white hover:bg-primary-soft shadow-sm border border-primary/10 rounded-full"
                    >
                      <Sparkles className="h-3 w-3 mr-1.5" /> Full AI Suite
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">
                          Story & Description
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleInputChange(
                              "description",
                              generateLuxuryNarrative(
                                formData.name || "this piece",
                                formData.category,
                              ),
                            )
                          }
                          className="h-6 text-[9px] font-bold text-primary px-2 hover:bg-primary-soft/50"
                        >
                          <Wand2 className="h-2.5 w-2.5 mr-1" /> Re-Compose
                        </Button>
                      </div>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Craft the narrative..."
                        className="rounded-2xl bg-white border-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none p-5 text-base"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">
                            Sustainability Promise
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleInputChange("sustainability", generateSustainabilityPromise())
                            }
                            className="h-6 text-[9px] font-bold text-emerald-600 px-2 hover:bg-emerald-50"
                          >
                            <Wand2 className="h-2.5 w-2.5 mr-1" /> Draft
                          </Button>
                        </div>
                        <Textarea
                          value={formData.sustainability}
                          onChange={(e) => handleInputChange("sustainability", e.target.value)}
                          placeholder="Sustainability details..."
                          className="rounded-xl bg-white border-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">
                            Care Instructions
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleInputChange("care_instructions", generateCareInstructions())
                            }
                            className="h-6 text-[9px] font-bold text-primary px-2 hover:bg-primary-soft/50"
                          >
                            <Wand2 className="h-2.5 w-2.5 mr-1" /> Draft
                          </Button>
                        </div>
                        <Textarea
                          value={formData.care_instructions}
                          onChange={(e) => handleInputChange("care_instructions", e.target.value)}
                          placeholder="Care instructions..."
                          className="rounded-xl bg-white border-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Logistics */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                      Sizing Matrix
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sizeOptions.map((size) => {
                      const active = formData.sizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeToggle(size)}
                          className={cn(
                            "px-6 py-3 rounded-full text-sm font-bold border-2 transition-all duration-300",
                            active
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                              : "bg-white text-muted-foreground border-muted/20 hover:border-primary/30",
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Inventory */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                      Available Units
                    </Label>
                    <Input
                      type="number"
                      value={formData.units}
                      onChange={(e) => handleInputChange("units", e.target.value)}
                      placeholder="0"
                      min="0"
                      className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 text-lg font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      Track inventory units. Products with fewer than 5 units will be marked as "Low
                      stock".
                    </p>
                  </div>
                </div>
              </form>
            </div>

            {/* Premium Footer */}
            <div className="p-10 border-t border-border/40 bg-muted/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-soft flex items-center justify-center text-primary">
                      <Save className="h-4 w-4" />
                    </div>
                  </div>
                  <span>Syncing with Global Inventory</span>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="rounded-full px-8 h-14 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="edit-luxury-product"
                    disabled={isSubmitting || isUploading}
                    className="rounded-full px-12 h-14 font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 min-w-[220px] transition-transform active:scale-95"
                  >
                    {isSubmitting ? "Syncing..." : "Update Luxury Piece"}
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
