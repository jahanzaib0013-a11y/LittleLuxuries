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
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
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
import { useAdminProducts, useInvalidateProducts } from "@/lib/product-queries";
import { useCategories } from "@/hooks/use-categories";
import { useSizes } from "@/hooks/use-sizes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type Database } from "@/lib/supabase";
import { ProductColorsEditor } from "@/components/product-colors-editor";
import {
  getProductColors,
  syncLegacyFieldsFromColors,
  validateProductColors,
  type ProductColor,
} from "@/lib/product-colors";
import {
  productModalContentClass,
  productModalFooterClass,
  productModalInputClass,
  productModalLabelClass,
  productModalSelectClass,
  productModalTextareaClass,
} from "@/components/product-modal-layout";
import { ProductModalShell } from "@/components/product-modal-shell";

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
  colors: ProductColor[];
  image_url: string;
  secondary_images: string[];
  sustainability: string;
  care_instructions: string;
  gender: string;
  units: string;
}

const badgeOptions = ["New", "Bestseller", "Low stock", "Limited edition", "Sale"];

export function EditProductModal({
  open,
  onOpenChange,
  product,
  onProductUpdated,
  onSuccess,
}: EditProductModalProps) {
  const invalidateProducts = useInvalidateProducts();
  const { categories } = useCategories();
  const { sizes: sizeOptions } = useSizes();
  const { data: adminProducts = [] } = useAdminProducts();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    category: "",
    variant: "",
    badge: "",
    description: "",
    sizes: [],
    colors: [],
    image_url: "",
    secondary_images: [],
    sustainability: "",
    care_instructions: "",
    gender: "unisex",
    units: "0",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const categoryOptions = React.useMemo(() => {
    const fromManageCategories = categories.map((c) => c.name.trim()).filter(Boolean);
    const fromProducts = adminProducts.map((p) => p.category?.trim() || "").filter(Boolean);
    const merged = [...fromManageCategories, ...fromProducts, formData.category].filter(Boolean);
    return Array.from(new Set(merged));
  }, [categories, adminProducts, formData.category]);

  useEffect(() => {
    if (product && open) {
      const colors = getProductColors(product);
      setFormData({
        name: product.name || "",
        price: product.price?.toString() || "",
        category: product.category || "",
        variant: product.variant || "",
        badge: product.badge || "",
        description: product.description || "",
        sizes: product.sizes || [],
        colors,
        image_url: product.image_url || "",
        secondary_images: product.secondary_images || [],
        sustainability: product.sustainability || "",
        care_instructions: product.care_instructions || "",
        gender: product.gender || "unisex",
        units: product.units?.toString() || "0",
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    const colorError = validateProductColors(formData.colors);
    if (colorError) {
      toast.error(colorError);
      return;
    }

    setIsSubmitting(true);

    try {
      const legacy = syncLegacyFieldsFromColors(formData.colors);
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        variant: legacy.variant,
        badge: formData.badge === "none" ? undefined : formData.badge,
        description: formData.description,
        sizes: formData.sizes,
        image_url: legacy.image_url,
        secondary_images: legacy.secondary_images,
        colors: legacy.colors,
        sustainability: formData.sustainability,
        care_instructions: formData.care_instructions,
        gender: formData.gender,
        units: parseInt(formData.units) || 0,
      };

      const result = await productService.updateProduct(product.id, productData);

      if (result) {
        await invalidateProducts();
        toast.success("Product updated successfully!");
        onProductUpdated?.();
        onSuccess?.(result);
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
      <DialogContent className={productModalContentClass}>
        <ProductModalShell
          onClose={handleClose}
          colorsPane={
            <ProductColorsEditor
              colors={formData.colors}
              onChange={(colors) => setFormData((prev) => ({ ...prev, colors }))}
              isUploading={isUploading}
              onUploadingChange={setIsUploading}
            />
          }
          header={
            <div className="min-w-0 space-y-1.5">
              <DialogTitle className="font-serif text-xl leading-tight text-primary sm:text-2xl lg:text-3xl">
                Edit product
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <p className="line-clamp-2 min-w-0 text-xs text-muted-foreground sm:text-sm">
                  {product?.name}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                    product?.status === "published"
                      ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                      : product?.status === "scheduled"
                        ? "border-blue-100 bg-blue-50 text-blue-600"
                        : "border-border/50 bg-muted text-muted-foreground",
                  )}
                >
                  {product?.status || "Draft"}
                </span>
                    </div>
                </div>
          }
          footer={
            <div className={productModalFooterClass}>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="min-h-11 w-full rounded-full text-base font-semibold sm:min-h-12 sm:w-auto sm:px-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="edit-luxury-product"
                  disabled={isSubmitting || isUploading}
                  className="min-h-11 w-full rounded-full bg-primary text-base font-semibold shadow-md sm:min-h-12 sm:min-w-[180px] sm:w-auto"
                >
                  {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          }
        >
              <form id="edit-luxury-product" onSubmit={handleSubmit} className="space-y-8 pb-4 sm:space-y-10 lg:space-y-12">
                {/* 1. Core Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-3">
                    <Label className={productModalLabelClass}>Product Title</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Product Title"
                      className={cn(productModalInputClass, "font-medium")}
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className={productModalLabelClass}>Price (PKR)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0.00"
                      className={cn(productModalInputClass, "font-medium")}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-3">
                    <Label className={productModalLabelClass}>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(v) => handleInputChange("gender", v)}
                    >
                      <SelectTrigger className={productModalSelectClass}>
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
                  <div className="space-y-3">
                    <Label className={productModalLabelClass}>Available Units</Label>
                    <Input
                      type="number"
                      value={formData.units}
                      onChange={(e) => handleInputChange("units", e.target.value)}
                      placeholder="0"
                      min="0"
                      className={cn(productModalInputClass, "font-medium")}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic -mt-6">
                  Track inventory units. Products with fewer than 5 units will be marked as "Low
                  stock".
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-3">
                    <Label className={productModalLabelClass}>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleInputChange("category", v)}
                    >
                      <SelectTrigger className={productModalSelectClass}>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {categoryOptions.map((categoryName) => (
                          <SelectItem key={categoryName} value={categoryName} className="rounded-xl py-3">
                            {categoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className={productModalLabelClass}>Badge</Label>
                    <Select
                      value={formData.badge}
                      onValueChange={(v) => handleInputChange("badge", v)}
                    >
                      <SelectTrigger className={productModalSelectClass}>
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
                <div className="space-y-6 rounded-2xl border border-border/30 bg-muted/10 p-4 sm:rounded-[32px] sm:p-8">
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
                        className={productModalTextareaClass}
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
                      const active = formData.sizes.includes(size.name);
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => handleSizeToggle(size.name)}
                          className={cn(
                            "rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-all duration-300 sm:px-6 sm:py-3",
                            active
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                              : "bg-white text-muted-foreground border-muted/20 hover:border-primary/30",
                          )}
                        >
                          {size.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
        </ProductModalShell>
      </DialogContent>
    </Dialog>
  );
}
