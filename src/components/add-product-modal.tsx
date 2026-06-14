import React, { useState, useRef, useEffect } from "react";
import { useCategories, type CategoryDef } from "@/hooks/use-categories";
import { useBadges, type BadgeDef } from "@/hooks/use-badges";
import { useSizes, type SizeDef } from "@/hooks/use-sizes";
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
  Plus,
  X,
  Upload,
  CheckCircle2,
  ImagePlus,
  Sparkles,
  Wand2,
  ImageIcon,
  Trash2,
  GripVertical,
  Pin,
  PinOff,
  Ruler,
} from "lucide-react";
import {
  generateLuxuryNarrative,
  generateSustainabilityPromise,
  generateCareInstructions,
} from "@/lib/luxury-engine";
import { productService } from "@/lib/supabase-service";
import { useAdminProducts, useInvalidateProducts } from "@/lib/product-queries";
import { imageService } from "@/lib/image-service";
import { type Database } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductColorsEditor } from "@/components/product-colors-editor";
import { ProductSizeChartEditor } from "@/components/product-size-chart-editor";
import { createEmptySizeChart, type SizeChart } from "@/lib/size-chart";
import {
  createEmptyColor,
  syncLegacyFieldsFromColors,
  validateProductColors,
  type ProductColor,
} from "@/lib/product-colors";
import {
  nestedModalContentClass,
  nestedModalInnerClass,
  productModalContentClass,
  productModalFooterClass,
  productModalInputClass,
  productModalLabelClass,
  productModalSelectClass,
  productModalTextareaClass,
} from "@/components/product-modal-layout";
import { ProductModalShell } from "@/components/product-modal-shell";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: Database["public"]["Tables"]["products"]["Row"] | null) => void;
  onProductAdded?: () => void;
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
  sizeChart: SizeChart;
  image_url: string;
  secondary_images: string[];
  sustainability: string;
  care_instructions: string;
  units: string;
  initialData?: Partial<Database["public"]["Tables"]["products"]["Row"]>;
  gender: string;
}

export function AddProductModal({
  open,
  onOpenChange,
  onProductAdded,
  onSuccess,
}: AddProductModalProps) {
  const invalidateProducts = useInvalidateProducts();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    category: "",
    variant: "",
    badge: "",
    description: "",
    sizes: [],
    colors: [createEmptyColor(true)],
    sizeChart: createEmptySizeChart(),
    image_url: "",
    secondary_images: [],
    sustainability: "",
    care_instructions: "",
    units: "0",
    gender: "unisex",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Custom Category & Badge states
  const { categories, setCategories } = useCategories();
  const { data: adminProducts = [] } = useAdminProducts();

  const [newCategory, setNewCategory] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<string | null>(null);
  const [isUploadingCategory, setIsUploadingCategory] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Manage Categories states
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryImage, setEditCategoryImage] = useState<string | null>(null);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const [draftCategories, setDraftCategories] = useState<CategoryDef[] | null>(null);
  const [hasCategoryChanges, setHasCategoryChanges] = useState(false);
  const lastDragTargetId = useRef<string | null>(null);

  const { badges: badgeOptions, setBadges: setBadgeOptions } = useBadges();
  const { sizes: sizeOptions, setSizes } = useSizes();
  const [newBadge, setNewBadge] = useState("");
  const [isAddingBadge, setIsAddingBadge] = useState(false);
  const [isManagingBadges, setIsManagingBadges] = useState(false);
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [editBadgeName, setEditBadgeName] = useState("");
  const [newSize, setNewSize] = useState("");
  const [isAddingSize, setIsAddingSize] = useState(false);
  const [isManagingSizes, setIsManagingSizes] = useState(false);
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [editSizeName, setEditSizeName] = useState("");

  const managementActionClass =
    "min-h-10 h-auto w-full max-w-full flex-wrap rounded-xl border border-border/60 bg-white px-2.5 py-2.5 text-[11px] sm:text-xs font-medium normal-case tracking-normal leading-snug text-primary text-center whitespace-normal shadow-sm transition-colors hover:bg-primary-soft/30 hover:border-primary/40";

  const categoryImageRef = useRef<HTMLInputElement>(null);
  const editCategoryImageRef = useRef<HTMLInputElement>(null);

  const unifiedCategories = React.useMemo(() => {
    const byName = new Map<string, CategoryDef>();
    categories.forEach((cat) => {
      byName.set(cat.name.trim().toLowerCase(), cat);
    });

    adminProducts.forEach((product) => {
      const name = product.category?.trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, {
          id: `db-${key.replace(/\s+/g, "-")}`,
          name,
          image: null,
        });
      }
    });

    return Array.from(byName.values());
  }, [categories, adminProducts]);

  // NOTE: we intentionally do NOT auto-persist product categories into the
  // curated list. Doing so polluted the list and re-added categories right
  // after they were deleted. Product categories still surface in the form
  // dropdown via `unifiedCategories` (read-only) and remain filterable on the
  // shop (derived from products at read time).

  const handleCategoryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditing: boolean = false,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      if (isEditing) setEditCategoryImage(previewUrl);
      else setNewCategoryImage(previewUrl);

      setIsUploadingCategory(true);
      try {
        const imageUrl = await imageService.uploadImage(file);
        console.log("[Category Upload] Supabase URL:", imageUrl);
        if (isEditing) setEditCategoryImage(imageUrl);
        else setNewCategoryImage(imageUrl);
        toast.success("Category image uploaded");
      } catch (error) {
        console.error("[Category Upload] Error:", error);
        toast.error("Failed to upload category image");
        if (isEditing) setEditCategoryImage(null);
        else setNewCategoryImage(null);
      } finally {
        setIsUploadingCategory(false);
      }
    }
  };

  const moveCategory = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    setDraftCategories((prev) => {
      if (!prev) return prev;
      const draggedIndex = prev.findIndex((cat) => cat.id === draggedId);
      const targetIndex = prev.findIndex((cat) => cat.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) return prev;
      const reordered = [...prev];
      const [draggedItem] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, draggedItem);
      return reordered;
    });
    setHasCategoryChanges(true);
  };

  const moveCategoryToIndex = (categoryId: string, targetIndex: number) => {
    setDraftCategories((prev) => {
      if (!prev) return prev;
      const currentIndex = prev.findIndex((cat) => cat.id === categoryId);
      if (currentIndex < 0) return prev;
      const boundedTarget = Math.max(0, Math.min(targetIndex, prev.length - 1));
      if (currentIndex === boundedTarget) return prev;
      const updated = [...prev];
      const [item] = updated.splice(currentIndex, 1);
      updated.splice(boundedTarget, 0, item);
      return updated;
    });
    setHasCategoryChanges(true);
  };

  const openManageCategories = () => {
    setDraftCategories([...unifiedCategories]);
    setHasCategoryChanges(false);
    setEditingCategoryId(null);
    setIsManagingCategories(true);
  };

  const closeManageCategories = () => {
    setIsManagingCategories(false);
    setDraftCategories(null);
    setHasCategoryChanges(false);
    setEditingCategoryId(null);
    setDraggingCategoryId(null);
    setDragOverCategoryId(null);
    lastDragTargetId.current = null;
  };

  const saveManageCategories = async () => {
    if (draftCategories) {
      // Detect renames (same id, changed name) so we can move existing products
      // onto the new name — otherwise they'd be orphaned on the old value.
      const prevById = new Map(categories.map((c) => [c.id, c.name]));
      const renames = draftCategories
        .map((c) => ({ from: prevById.get(c.id), to: c.name }))
        .filter((r): r is { from: string; to: string } => !!r.from && r.from !== r.to);

      setCategories(draftCategories);
      setHasCategoryChanges(false);

      if (renames.length > 0) {
        let updated = 0;
        for (const { from, to } of renames) {
          const affected = adminProducts.filter((p) => p.category === from);
          for (const p of affected) {
            const ok = await productService.updateProduct(p.id, { category: to });
            if (ok) updated += 1;
          }
        }
        toast.success(
          updated > 0
            ? `Categories saved — moved ${updated} product${updated === 1 ? "" : "s"}.`
            : "Categories saved.",
        );
      } else {
        toast.success("Categories saved.");
      }
    }
    closeManageCategories();
  };

  const displayedCategories = draftCategories ?? unifiedCategories;

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

    if (formData.sizes.length === 0) {
      toast.error("Please select at least one size");
      return;
    }

    setIsSubmitting(true);

    try {
      const unitsValue = parseInt(formData.units) || 0;
      const badgeValue = formData.badge === "none" ? undefined : formData.badge;
      const finalBadge = unitsValue < 5 && unitsValue > 0 ? "Low stock" : badgeValue;
      const legacy = syncLegacyFieldsFromColors(formData.colors);

      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        variant: legacy.variant,
        badge: finalBadge,
        description: formData.description,
        sizes: formData.sizes,
        image_url: legacy.image_url,
        secondary_images: legacy.secondary_images,
        colors: legacy.colors,
        size_chart: formData.sizeChart,
        sustainability: formData.sustainability,
        care_instructions: formData.care_instructions,
        units: unitsValue,
        gender: formData.gender,
        status: "draft",
      };

      const result = await productService.createProduct(productData);

      if (result) {
        await invalidateProducts();
        toast.success("Product saved as draft. Publish it when you're ready.");
        onOpenChange(false);
        onSuccess?.(result);
        onProductAdded?.();

        setFormData({
          name: "",
          price: "",
          category: "",
          variant: "",
          badge: "",
          description: "",
          sizes: [],
          colors: [createEmptyColor(true)],
          sizeChart: createEmptySizeChart(),
          image_url: "",
          secondary_images: [],
          sustainability: "",
          care_instructions: "",
          units: "0",
          gender: "unisex",
        });
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("An error occurred while adding the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onOpenChange(false);
  };

  return (
    <>
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
                  Add product
                </DialogTitle>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Colors first, then details. Saves as draft.
                </p>
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
                    form="add-luxury-product"
                    disabled={isSubmitting || isUploading}
                    className="min-h-11 w-full rounded-full bg-primary text-base font-semibold shadow-md sm:min-h-12 sm:min-w-[180px] sm:w-auto"
                  >
                    {isSubmitting ? "Saving…" : "Save product"}
                  </Button>
                </div>
              </div>
            }
          >
            <form
              id="add-luxury-product"
              onSubmit={handleSubmit}
              className="space-y-8 pb-4 sm:space-y-10 lg:space-y-12"
            >
              {/* 1. Core Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="space-y-3">
                  <Label className={productModalLabelClass}>Product Title</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Silk-Trimmed Organic Onesie"
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
                  <Label className={productModalLabelClass}>Gender / Classification</Label>
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
                  <div className="space-y-2">
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleInputChange("category", v)}
                    >
                      <SelectTrigger className={productModalSelectClass}>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {unifiedCategories.map((c) => (
                          <SelectItem key={c.id} value={c.name} className="rounded-xl py-3">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl border border-border/50 bg-muted/20 p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsAddingCategory(true)}
                        className={managementActionClass}
                      >
                        <span className="sm:hidden">+ Add category</span>
                        <span className="hidden sm:inline">+ Add new category</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={openManageCategories}
                        className={managementActionClass}
                      >
                        Manage categories
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className={productModalLabelClass}>Status Indicator</Label>
                  <div className="space-y-2">
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
                            key={b.id}
                            value={b.name}
                            className="rounded-xl py-3 font-bold text-primary"
                          >
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl border border-border/50 bg-muted/20 p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsAddingBadge(true)}
                        className={managementActionClass}
                      >
                        <span className="sm:hidden">+ Add badge</span>
                        <span className="hidden sm:inline">+ Add new badge</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsManagingBadges(true)}
                        className={managementActionClass}
                      >
                        Manage badges
                      </Button>
                    </div>
                  </div>
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
                      placeholder="Craft the narrative for this exquisite piece..."
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
                        placeholder="e.g., GOTS certified organic materials..."
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
                        placeholder="e.g., Hand wash with organic detergent..."
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
                  <span className="text-[10px] font-bold text-primary bg-primary-soft px-3 py-1 rounded-full uppercase">
                    Global Standards
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 -mt-2 rounded-2xl border border-border/50 bg-muted/20 p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddingSize(true)}
                    className={managementActionClass}
                  >
                    <span className="sm:hidden">+ Add size</span>
                    <span className="hidden sm:inline">+ Add new size</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsManagingSizes(true)}
                    className={managementActionClass}
                  >
                    Manage sizes
                  </Button>
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

              {/* 4. Size Chart */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                    Size Chart
                  </h4>
                  <span className="text-[10px] font-bold text-primary bg-primary-soft px-3 py-1 rounded-full uppercase">
                    Optional
                  </span>
                </div>
                <ProductSizeChartEditor
                  value={formData.sizeChart}
                  onChange={(sizeChart) => setFormData((prev) => ({ ...prev, sizeChart }))}
                  productSizes={formData.sizes}
                  category={formData.category}
                  isUploading={isUploading}
                  onUploadingChange={setIsUploading}
                />
              </div>
            </form>
          </ProductModalShell>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent className={nestedModalContentClass}>
          <div className={nestedModalInnerClass}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary mb-2 sm:text-2xl">
                Add New Category
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Create a new category for your products.
              </p>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-3">
                <Label className={productModalLabelClass}>Category Name</Label>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Blankets"
                  className={productModalInputClass}
                  autoFocus
                />
              </div>
              <div className="space-y-3">
                <Label className={productModalLabelClass}>Category Image</Label>
                <div
                  onClick={() => categoryImageRef.current?.click()}
                  className="relative aspect-video rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-muted/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all"
                >
                  {newCategoryImage ? (
                    <img
                      src={newCategoryImage}
                      alt="Category"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 mb-2 text-primary/40" />
                      <span className="text-[10px] font-bold text-primary/40 uppercase">
                        Upload Image
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={categoryImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCategoryUpload}
                />
              </div>
            </div>
            <DialogFooter className="mt-8">
              <Button
                variant="ghost"
                onClick={() => setIsAddingCategory(false)}
                className="rounded-full px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newCategory.trim()) {
                    const newCat: CategoryDef = {
                      id:
                        typeof crypto !== "undefined" && crypto.randomUUID
                          ? crypto.randomUUID()
                          : `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                      name: newCategory.trim(),
                      image:
                        newCategoryImage && !newCategoryImage.startsWith("blob:")
                          ? newCategoryImage
                          : null,
                    };
                    setCategories((prev) => [...prev, newCat]);
                    // Keep the Manage Categories draft in sync if it's open.
                    setDraftCategories((prev) => (prev ? [...prev, newCat] : prev));
                    handleInputChange("category", newCat.name);
                    toast.success(`Category "${newCat.name}" created`);
                  }
                  setNewCategory("");
                  setNewCategoryImage(null);
                  setIsAddingCategory(false);
                }}
                disabled={isUploadingCategory || !newCategory.trim()}
                className="rounded-full px-8 bg-primary hover:bg-primary/90"
              >
                Add Category
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Modal */}
      <Dialog
        open={isManagingCategories}
        onOpenChange={(open) => {
          if (open) openManageCategories();
          else closeManageCategories();
        }}
      >
        <DialogContent
          className={cn(
            nestedModalContentClass,
            "max-w-xl flex max-h-[min(92dvh,100%)] flex-col overflow-hidden",
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl sm:text-2xl text-primary mb-2">
                Manage Categories
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Edit existing categories and their featured images.
              </p>
              <p className="text-xs text-primary/70 font-medium">
                Drag categories by the grip icon to reorder homepage priority (top 5 are shown).
                Keep dragging through the list to move across multiple positions.
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {displayedCategories.slice(0, 5).map((cat, idx) => (
                  <span
                    key={`top-${cat.id}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary"
                  >
                    {idx + 1}. {cat.name}
                  </span>
                ))}
              </div>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 max-h-[62vh] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
              {displayedCategories.map((c, index) => (
                <div
                  key={c.id}
                  className={cn(
                    "relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border border-border/50 bg-muted/10 transition-all duration-150",
                    draggingCategoryId === c.id &&
                      "opacity-70 border-primary/50 bg-primary-soft/10 scale-[0.99] shadow-inner",
                    dragOverCategoryId === c.id &&
                      "border-primary bg-primary-soft/20 ring-2 ring-primary/20",
                    index < 5 && "border-primary/30 bg-primary-soft/5",
                  )}
                  draggable={editingCategoryId !== c.id}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", c.id);
                    setDraggingCategoryId(c.id);
                    setDragOverCategoryId(null);
                    lastDragTargetId.current = null;
                  }}
                  onDragEnd={() => {
                    setDraggingCategoryId(null);
                    setDragOverCategoryId(null);
                    lastDragTargetId.current = null;
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (draggingCategoryId && draggingCategoryId !== c.id) {
                      setDragOverCategoryId(c.id);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingCategoryId && draggingCategoryId !== c.id) {
                      setDragOverCategoryId(c.id);
                      if (lastDragTargetId.current !== c.id) {
                        moveCategory(draggingCategoryId, c.id);
                        lastDragTargetId.current = c.id;
                      }
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverCategoryId === c.id) {
                      setDragOverCategoryId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingCategoryId && draggingCategoryId !== c.id) {
                      moveCategory(draggingCategoryId, c.id);
                    }
                    setDraggingCategoryId(null);
                    setDragOverCategoryId(null);
                    lastDragTargetId.current = null;
                  }}
                >
                  {dragOverCategoryId === c.id && (
                    <div className="absolute left-3 right-3 top-0 h-0.5 bg-primary rounded-full" />
                  )}
                  {editingCategoryId === c.id ? (
                    <div className="flex-1 flex items-center gap-3">
                      <div
                        onClick={() => editCategoryImageRef.current?.click()}
                        className="h-12 w-12 rounded-xl bg-muted/30 border border-dashed border-primary/30 flex items-center justify-center overflow-hidden cursor-pointer shrink-0 group relative"
                      >
                        {editCategoryImage ? (
                          <img
                            src={editCategoryImage}
                            alt=""
                            className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-primary/40" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                          <Upload className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <Input
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className="h-10 rounded-xl bg-white flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const newName = editCategoryName.trim() || c.name;
                          const newImage =
                            editCategoryImage && !editCategoryImage.startsWith("blob:")
                              ? editCategoryImage
                              : c.image;
                          const apply = (cat: CategoryDef) =>
                            cat.id === c.id ? { ...cat, name: newName, image: newImage } : cat;
                          // Persist immediately (DB + cache) so an uploaded image
                          // sticks even if the modal is closed without "Save Changes".
                          setCategories((prev) =>
                            prev.some((x) => x.id === c.id)
                              ? prev.map(apply)
                              : [...prev, { ...c, name: newName, image: newImage }],
                          );
                          setDraftCategories((prev) => prev?.map(apply) ?? prev);
                          if (formData.category === c.name) handleInputChange("category", newName);
                          setEditingCategoryId(null);
                          // Move existing products onto the new name when renamed.
                          if (newName !== c.name) {
                            const affected = adminProducts.filter((p) => p.category === c.name);
                            let moved = 0;
                            for (const p of affected) {
                              if (await productService.updateProduct(p.id, { category: newName }))
                                moved += 1;
                            }
                            toast.success(
                              moved > 0
                                ? `Category updated — moved ${moved} product${moved === 1 ? "" : "s"}.`
                                : "Category updated.",
                            );
                          } else {
                            toast.success("Category image updated.");
                          }
                        }}
                        className="rounded-xl px-4 bg-primary text-white"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCategoryId(null)}
                        className="rounded-xl px-2 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-soft px-1.5 text-[10px] font-bold text-primary">
                          {index + 1}
                        </span>
                        <div
                          className={cn(
                            "h-10 w-10 rounded-xl border border-border/40 bg-white/70 flex items-center justify-center cursor-grab active:cursor-grabbing",
                            draggingCategoryId === c.id && "bg-primary-soft border-primary/40",
                          )}
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                          {c.image ? (
                            <img src={c.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {c.name}
                          </span>
                          {index < 5 ? (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                              Visible on homepage
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Hidden from homepage
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        {index < 5 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              moveCategoryToIndex(c.id, Math.min(5, displayedCategories.length - 1))
                            }
                            className="h-auto min-h-8 flex-1 sm:flex-none rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-amber-700 hover:bg-amber-50 whitespace-normal"
                            title="Remove from homepage top 5"
                          >
                            <PinOff className="h-3.5 w-3.5 shrink-0" />
                            <span className="sm:hidden">Hide</span>
                            <span className="hidden sm:inline">Hide from home</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveCategoryToIndex(c.id, 0)}
                            className="h-auto min-h-8 flex-1 sm:flex-none rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-primary hover:bg-primary-soft/50 whitespace-normal"
                            title="Add to homepage top 5"
                          >
                            <Pin className="h-3.5 w-3.5 shrink-0" />
                            <span className="sm:hidden">Show</span>
                            <span className="hidden sm:inline">Show on home</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCategoryId(c.id);
                            setEditCategoryName(c.name);
                            setEditCategoryImage(c.image);
                          }}
                          className="h-8 rounded-lg px-3 text-xs font-medium"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Persist the delete immediately (DB + cache) so it sticks.
                            setCategories((prev) => prev.filter((cat) => cat.id !== c.id));
                            setDraftCategories(
                              (prev) => prev?.filter((cat) => cat.id !== c.id) ?? prev,
                            );
                            if (formData.category === c.name) handleInputChange("category", "");
                            toast.success("Category removed");
                          }}
                          className="h-8 w-full sm:w-8 rounded-lg p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {displayedCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No categories exist yet.
                </div>
              )}
            </div>
            <input
              ref={editCategoryImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleCategoryUpload(e, true)}
            />
            <DialogFooter className="mt-5 shrink-0 gap-2 sm:mt-8 sm:flex-row">
              <Button
                variant="ghost"
                onClick={closeManageCategories}
                className="h-11 w-full rounded-full sm:w-auto sm:px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={saveManageCategories}
                disabled={!hasCategoryChanges}
                className="h-11 w-full rounded-full bg-primary sm:w-auto sm:px-8"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Badge Modal */}
      <Dialog open={isAddingBadge} onOpenChange={setIsAddingBadge}>
        <DialogContent className={nestedModalContentClass}>
          <div className={nestedModalInnerClass}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary mb-2 sm:text-2xl">
                Add New Badge
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-3">
                <Label className={productModalLabelClass}>Badge Name</Label>
                <Input
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="e.g. Exclusive"
                  className={productModalInputClass}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="mt-8">
              <Button
                variant="ghost"
                onClick={() => setIsAddingBadge(false)}
                className="rounded-full px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newBadge.trim()) {
                    const newB: BadgeDef = {
                      id: Math.random().toString(36).substring(2, 9),
                      name: newBadge.trim(),
                    };
                    setBadgeOptions((prev) => [...prev, newB]);
                    handleInputChange("badge", newB.name);
                    toast.success(`Badge "${newB.name}" created`);
                  }
                  setNewBadge("");
                  setIsAddingBadge(false);
                }}
                disabled={!newBadge.trim()}
                className="rounded-full px-8 bg-primary hover:bg-primary/90"
              >
                Add Badge
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Size Modal */}
      <Dialog open={isAddingSize} onOpenChange={setIsAddingSize}>
        <DialogContent className={nestedModalContentClass}>
          <div className={nestedModalInnerClass}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary mb-2 sm:text-2xl">
                Add New Size
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-3">
                <Label className={productModalLabelClass}>Size Label</Label>
                <Input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="e.g. 24–36M"
                  className={productModalInputClass}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="mt-8">
              <Button
                variant="ghost"
                onClick={() => setIsAddingSize(false)}
                className="rounded-full px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const normalized = newSize.trim();
                  if (!normalized) return;
                  if (sizeOptions.some((s) => s.name.toLowerCase() === normalized.toLowerCase())) {
                    toast.error("Size already exists");
                    return;
                  }
                  const created: SizeDef = {
                    id: `size-${Math.random().toString(36).slice(2, 9)}`,
                    name: normalized,
                  };
                  setSizes((prev) => [...prev, created]);
                  setNewSize("");
                  setIsAddingSize(false);
                  toast.success(`Size "${normalized}" added`);
                }}
                className="rounded-full px-8 bg-primary hover:bg-primary/90"
              >
                Add Size
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Sizes Modal */}
      <Dialog open={isManagingSizes} onOpenChange={setIsManagingSizes}>
        <DialogContent className={nestedModalContentClass}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary mb-2 sm:text-2xl">
              Manage Sizes
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Create and edit your sizing options.</p>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {sizeOptions.map((size) => (
              <div
                key={size.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-muted/10"
              >
                {editingSizeId === size.id ? (
                  <div className="flex-1 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                      <Ruler className="h-4 w-4 text-primary" />
                    </div>
                    <Input
                      value={editSizeName}
                      onChange={(e) => setEditSizeName(e.target.value)}
                      className="h-10 rounded-xl bg-white flex-1"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const normalized = editSizeName.trim();
                        if (!normalized) return;
                        setSizes((prev) =>
                          prev.map((s) => (s.id === size.id ? { ...s, name: normalized } : s)),
                        );
                        if (formData.sizes.includes(size.name)) {
                          setFormData((prev) => ({
                            ...prev,
                            sizes: prev.sizes.map((s) => (s === size.name ? normalized : s)),
                          }));
                        }
                        setEditingSizeId(null);
                        toast.success("Size updated");
                      }}
                      className="rounded-xl px-4 bg-primary text-white"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingSizeId(null)}
                      className="rounded-xl px-2 text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                        <Ruler className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm text-foreground">{size.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSizeId(size.id);
                          setEditSizeName(size.name);
                        }}
                        className="h-8 rounded-lg px-3 text-xs font-medium"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSizes((prev) => prev.filter((s) => s.id !== size.id));
                          setFormData((prev) => ({
                            ...prev,
                            sizes: prev.sizes.filter((s) => s !== size.name),
                          }));
                          toast.success("Size removed");
                        }}
                        className="h-8 w-8 rounded-lg p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {sizeOptions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No sizes exist yet.
              </div>
            )}
          </div>
          <DialogFooter className="mt-8">
            <Button
              variant="ghost"
              onClick={() => setIsManagingSizes(false)}
              className="rounded-full px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Badges Modal */}
      <Dialog open={isManagingBadges} onOpenChange={setIsManagingBadges}>
        <DialogContent className={nestedModalContentClass}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary mb-2 sm:text-2xl">
              Manage Badges
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Edit existing product badges.</p>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {badgeOptions.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-muted/10"
              >
                {editingBadgeId === b.id ? (
                  <div className="flex-1 flex items-center gap-3">
                    <Input
                      value={editBadgeName}
                      onChange={(e) => setEditBadgeName(e.target.value)}
                      className="h-10 rounded-xl bg-white flex-1"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        setBadgeOptions(
                          badgeOptions.map((badge) =>
                            badge.id === b.id ? { ...badge, name: editBadgeName } : badge,
                          ),
                        );
                        if (formData.badge === b.name) handleInputChange("badge", editBadgeName);
                        setEditingBadgeId(null);
                        toast.success("Badge updated");
                      }}
                      className="rounded-xl px-4 bg-primary text-white"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingBadgeId(null)}
                      className="rounded-xl px-2 text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm bg-primary-soft text-primary px-3 py-1 rounded-full">
                        {b.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBadgeId(b.id);
                          setEditBadgeName(b.name);
                        }}
                        className="h-8 rounded-lg px-3 text-xs font-medium"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setBadgeOptions(badgeOptions.filter((badge) => badge.id !== b.id));
                          if (formData.badge === b.name) handleInputChange("badge", "");
                          toast.success("Badge removed");
                        }}
                        className="h-8 w-8 rounded-lg p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {badgeOptions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No badges exist yet.
              </div>
            )}
          </div>
          <DialogFooter className="mt-8">
            <Button
              variant="ghost"
              onClick={() => setIsManagingBadges(false)}
              className="rounded-full px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
