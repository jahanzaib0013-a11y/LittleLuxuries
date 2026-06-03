import React, { useState, useRef, useEffect } from "react";
import { useCategories, type CategoryDef } from "@/hooks/use-categories";
import { useBadges, type BadgeDef } from "@/hooks/use-badges";
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
} from "lucide-react";
import {
  generateLuxuryNarrative,
  generateSustainabilityPromise,
  generateCareInstructions,
} from "@/lib/luxury-engine";
import { productService } from "@/lib/supabase-service";
import { imageService } from "@/lib/image-service";
import { type Database } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  image_url: string;
  secondary_images: string[];
  sustainability: string;
  care_instructions: string;
  units: string;
  initialData?: Partial<Database["public"]["Tables"]["products"]["Row"]>;
  gender: string;
}

const sizeOptions = ["Newborn", "0–3M", "3–6M", "6–12M", "12–18M", "18–24M", "One Size"];

export function AddProductModal({ open, onOpenChange, onProductAdded }: AddProductModalProps) {
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
    units: "0",
    gender: "unisex",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [secondaryPreviews, setSecondaryPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Custom Category & Badge states
  const { categories, setCategories } = useCategories();

  const [newCategory, setNewCategory] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<string | null>(null);
  const [isUploadingCategory, setIsUploadingCategory] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Manage Categories states
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryImage, setEditCategoryImage] = useState<string | null>(null);

  const { badges: badgeOptions, setBadges: setBadgeOptions } = useBadges();
  const [newBadge, setNewBadge] = useState("");
  const [isAddingBadge, setIsAddingBadge] = useState(false);
  const [isManagingBadges, setIsManagingBadges] = useState(false);
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [editBadgeName, setEditBadgeName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const categoryImageRef = useRef<HTMLInputElement>(null);
  const editCategoryImageRef = useRef<HTMLInputElement>(null);

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
        if (isEditing) setEditCategoryImage(imageUrl);
        else setNewCategoryImage(imageUrl);
        toast.success("Category image uploaded");
      } catch (error) {
        toast.error("Failed to upload category image");
        if (isEditing) setEditCategoryImage(null);
        else setNewCategoryImage(null);
      } finally {
        setIsUploadingCategory(false);
      }
    }
  };

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
        toast.success("Main image uploaded");
      } catch (error) {
        toast.error("Failed to upload main image");
        setImagePreview(null);
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
      toast.error("Please fill in all required fields and upload a main image");
      return;
    }

    if (formData.secondary_images.length < 2) {
      toast.error("Please upload at least 2 secondary images (max 5)");
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

      // Auto-set "Low stock" badge if units are below threshold
      const finalBadge = unitsValue < 5 && unitsValue > 0 ? "Low stock" : badgeValue;

      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        variant: formData.variant,
        badge: finalBadge,
        description: formData.description,
        sizes: formData.sizes,
        image_url: formData.image_url,
        secondary_images: formData.secondary_images,
        sustainability: formData.sustainability,
        care_instructions: formData.care_instructions,
        units: unitsValue,
        gender: formData.gender,
        status: "published",
      };

      const result = await productService.createProduct(productData);

      if (result) {
        toast.success("Luxury product created successfully!");
        onOpenChange(false);
        onProductAdded?.();

        setFormData({
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
          units: "0",
          gender: "unisex",
        });
        setImagePreview(null);
        setSecondaryPreviews([]);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("An error occurred while adding the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      secondaryPreviews.forEach((p) => {
        if (p.startsWith("blob:")) URL.revokeObjectURL(p);
      });
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] w-full lg:max-w-5xl p-0 overflow-y-auto lg:overflow-hidden border-none shadow-2xl bg-white rounded-[32px] lg:rounded-[40px] h-auto lg:h-[90vh] max-h-[95vh] flex flex-col">
          <div className="flex flex-col lg:flex-row flex-1 w-full lg:overflow-hidden">
            {/* Left Column: Media Workspace */}
            <div className="w-full lg:w-[400px] bg-muted/20 border-b lg:border-b-0 lg:border-r border-border/50 p-6 lg:p-10 flex flex-col lg:overflow-y-auto custom-scrollbar shrink-0">
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                      Primary View
                    </h3>
                    {imagePreview && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                        Selected
                      </span>
                    )}
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <ImageIcon className="h-10 w-10 mb-3 text-primary/20" />
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                          Main Product Image
                        </p>
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
                    {imagePreview ? "Change Main Image" : "Upload Main Image"}
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
                  <p className="text-[10px] text-muted-foreground text-center italic font-medium">
                    At least 2 required for the premium detail view
                  </p>
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

            {/* Right Column: Detailed Configuration */}
            <div className="flex-1 flex flex-col bg-white lg:overflow-hidden">
              <div className="p-6 pb-4 lg:p-10 lg:pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-4xl font-serif text-primary tracking-tight">
                      Luxury Product Suite
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground font-medium">
                        Define the core, classification, and brand narrative.
                      </p>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-widest border border-border/50">
                        Saving as Draft
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-primary/20"></div>
                    <div className="h-2 w-2 rounded-full bg-primary/20"></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 lg:overflow-y-auto p-6 lg:p-10 lg:pt-4 pt-2 space-y-8 lg:space-y-12 custom-scrollbar">
                <form id="add-luxury-product" onSubmit={handleSubmit} className="space-y-12">
                  {/* 1. Core Identity */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 min-h-[36px] flex items-end pb-1.5">
                        Product Title
                      </Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., Silk-Trimmed Organic Onesie"
                        className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 text-lg font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 min-h-[36px] flex items-end pb-1.5">
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
                      <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 min-h-[36px] flex items-end pb-1.5">
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
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 min-h-[36px] flex items-end pb-1.5">
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
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic -mt-6">
                    Track inventory units. Products with fewer than 5 units will be marked as "Low
                    stock".
                  </p>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 min-h-[36px] flex items-end pb-1.5">
                        Category
                      </Label>
                      <div className="space-y-2">
                        <Select
                          value={formData.category}
                          onValueChange={(v) => handleInputChange("category", v)}
                        >
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.name} className="rounded-xl py-3">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setIsAddingCategory(true)}
                            className="text-[10px] text-primary font-bold uppercase tracking-wider hover:underline"
                          >
                            + Add New Category
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsManagingCategories(true)}
                            className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider hover:text-primary hover:underline"
                          >
                            Manage Categories
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 min-h-[36px] flex items-end pb-1.5">
                        Status Indicator
                      </Label>
                      <div className="space-y-2">
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
                                key={b.id}
                                value={b.name}
                                className="rounded-xl py-3 font-bold text-primary"
                              >
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setIsAddingBadge(true)}
                            className="text-[10px] text-primary font-bold uppercase tracking-wider hover:underline"
                          >
                            + Add New Badge
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsManagingBadges(true)}
                            className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider hover:text-primary hover:underline"
                          >
                            Manage Badges
                          </button>
                        </div>
                      </div>
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
                            generateLuxuryNarrative(
                              formData.name || "this piece",
                              formData.category,
                            ),
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
                </form>
              </div>

              {/* Premium Footer */}
              <div className="p-6 lg:p-10 border-t border-border/40 bg-muted/5 rounded-b-[32px] lg:rounded-b-[40px]">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-soft flex items-center justify-center text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                    <span>Validation Passed & Ready for Launch</span>
                  </div>
                  <div className="flex items-center justify-end gap-4 w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      onClick={handleClose}
                      className="rounded-full px-8 h-14 font-bold"
                    >
                      Discard
                    </Button>
                    <Button
                      type="submit"
                      form="add-luxury-product"
                      disabled={isSubmitting || isUploading}
                      className="rounded-full px-12 h-14 font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 min-w-[220px] transition-transform active:scale-95"
                    >
                      {isSubmitting ? "Launching Piece..." : "Launch Product"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary mb-2">
              Add New Category
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Create a new category for your products.
            </p>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                Category Name
              </Label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Blankets"
                className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                Category Image
              </Label>
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
                    id: Math.random().toString(36).substring(2, 9),
                    name: newCategory.trim(),
                    image: newCategoryImage,
                  };
                  setCategories((prev) => [...prev, newCat]);
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
        </DialogContent>
      </Dialog>

      {/* Manage Categories Modal */}
      <Dialog open={isManagingCategories} onOpenChange={setIsManagingCategories}>
        <DialogContent className="max-w-xl bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary mb-2">
              Manage Categories
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Edit existing categories and their featured images.
            </p>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-muted/10"
              >
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
                      onClick={() => {
                        setCategories(
                          categories.map((cat) =>
                            cat.id === c.id
                              ? { ...cat, name: editCategoryName, image: editCategoryImage }
                              : cat,
                          ),
                        );
                        if (formData.category === c.name)
                          handleInputChange("category", editCategoryName);
                        setEditingCategoryId(null);
                        toast.success("Category updated");
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
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                        {c.image ? (
                          <img src={c.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <span className="font-medium text-sm text-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                          setCategories(categories.filter((cat) => cat.id !== c.id));
                          if (formData.category === c.name) handleInputChange("category", "");
                          toast.success("Category removed");
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
            {categories.length === 0 && (
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
          <DialogFooter className="mt-8">
            <Button
              variant="ghost"
              onClick={() => setIsManagingCategories(false)}
              className="rounded-full px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Badge Modal */}
      <Dialog open={isAddingBadge} onOpenChange={setIsAddingBadge}>
        <DialogContent className="max-w-sm bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary mb-2">
              Add New Badge
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60">
                Badge Name
              </Label>
              <Input
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                placeholder="e.g. Exclusive"
                className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
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
        </DialogContent>
      </Dialog>

      {/* Manage Badges Modal */}
      <Dialog open={isManagingBadges} onOpenChange={setIsManagingBadges}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary mb-2">
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
