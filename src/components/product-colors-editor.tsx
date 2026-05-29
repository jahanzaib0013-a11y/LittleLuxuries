import { useRef } from "react";

import {

  CheckCircle2,

  Circle,

  ImagePlus,

  Palette,

  Plus,

  Star,

  Trash2,

  Upload,

} from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { imageService } from "@/lib/image-service";

import { toast } from "sonner";

import { createEmptyColor, type ProductColor } from "@/lib/product-colors";



/** Tap-to-select — no typing needed */

const COLOR_PRESETS = [

  { id: "white", name: "White", hex: "#F8F6F3" },

  { id: "cream", name: "Cream", hex: "#F5EDE0" },

  { id: "pink", name: "Pink", hex: "#F4C2C2" },

  { id: "rose", name: "Rose", hex: "#E8B4B8" },

  { id: "red", name: "Red", hex: "#D64545" },

  { id: "orange", name: "Orange", hex: "#F4A261" },

  { id: "yellow", name: "Yellow", hex: "#F5E6A8" },

  { id: "green", name: "Green", hex: "#B8D4C8" },

  { id: "mint", name: "Mint", hex: "#A8E6CF" },

  { id: "blue", name: "Blue", hex: "#A8C8E8" },

  { id: "navy", name: "Navy", hex: "#2C3E6B" },

  { id: "purple", name: "Purple", hex: "#C9B8E8" },

  { id: "brown", name: "Brown", hex: "#8B6914" },

  { id: "black", name: "Black", hex: "#2A2A2A" },

  { id: "grey", name: "Grey", hex: "#B0B0B0" },

  { id: "multi", name: "Multi", hex: "#E8E8E8" },

] as const;



function presetForColor(color: ProductColor) {

  const byName = COLOR_PRESETS.find(

    (p) => p.name.toLowerCase() === color.name.trim().toLowerCase(),

  );

  if (byName) return byName.id;

  if (color.name.trim() === "Custom") return "custom";

  return null;

}



type ProductColorsEditorProps = {

  colors: ProductColor[];

  onChange: (colors: ProductColor[]) => void;

  isUploading: boolean;

  onUploadingChange: (uploading: boolean) => void;

};



function PresetButton({

  preset,

  selected,

  onSelect,

}: {

  preset: (typeof COLOR_PRESETS)[number];

  selected: boolean;

  onSelect: () => void;

}) {

  return (

    <button

      type="button"

      onClick={onSelect}

      className={cn(

        "flex shrink-0 snap-start flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all",

        "w-[4.5rem] sm:w-auto",

        selected

          ? "border-primary bg-primary-soft/40 shadow-sm"

          : "border-transparent bg-muted/30 active:bg-muted/50",

      )}

    >

      <span

        className={cn(

          "h-9 w-9 rounded-full border-2 shadow-inner sm:h-10 sm:w-10",

          selected ? "border-primary" : "border-white",

        )}

        style={{ backgroundColor: preset.hex }}

      />

      <span

        className={cn(

          "max-w-full truncate text-[10px] font-medium leading-tight",

          selected ? "text-primary" : "text-muted-foreground",

        )}

      >

        {preset.name}

      </span>

    </button>

  );

}



export function ProductColorsEditor({

  colors,

  onChange,

  isUploading,

  onUploadingChange,

}: ProductColorsEditorProps) {

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const secondaryRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const customPickerRefs = useRef<Record<string, HTMLInputElement | null>>({});



  const updateColor = (id: string, patch: Partial<ProductColor>) => {

    onChange(colors.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  };



  const removeColor = (id: string) => {

    if (colors.length <= 1) {

      toast.error("Keep at least one color");

      return;

    }

    const next = colors.filter((c) => c.id !== id);

    if (!next.some((c) => c.is_default)) next[0] = { ...next[0], is_default: true };

    onChange(next);

  };



  const setDefault = (id: string) => {

    onChange(colors.map((c) => ({ ...c, is_default: c.id === id })));

    toast.success("Shown first in shop");

  };



  const addColor = () => {

    onChange([...colors, createEmptyColor(false)]);

  };



  const pickPreset = (colorId: string, preset: (typeof COLOR_PRESETS)[number]) => {

    updateColor(colorId, { name: preset.name, hex: preset.hex });

  };



  const pickCustom = (colorId: string, hex: string) => {

    updateColor(colorId, { name: "Custom", hex });

  };



  const uploadMain = async (colorId: string, file: File) => {

    if (!file.type.startsWith("image/")) {

      toast.error("Use a JPG or PNG photo");

      return;

    }

    onUploadingChange(true);

    try {

      const url = await imageService.uploadImage(file);

      updateColor(colorId, { image_url: url });

      toast.success("Photo added");

    } catch {

      toast.error("Upload failed — try again");

    } finally {

      onUploadingChange(false);

    }

  };



  const uploadSecondary = async (colorId: string, files: FileList | File[]) => {

    const color = colors.find((c) => c.id === colorId);

    if (!color) return;

    const list = Array.from(files);

    const room = 5 - (color.secondary_images?.length ?? 0);

    if (list.length > room) {

      toast.error(`Max 5 extra photos (${room} left)`);

      return;

    }

    onUploadingChange(true);

    const added: string[] = [];

    try {

      for (const file of list) {

        if (!file.type.startsWith("image/")) continue;

        added.push(await imageService.uploadImage(file));

      }

      if (added.length > 0) {

        updateColor(colorId, {

          secondary_images: [...(color.secondary_images ?? []), ...added],

        });

      }

    } catch {

      toast.error("Upload failed");

    } finally {

      onUploadingChange(false);

    }

  };



  const removeSecondary = (colorId: string, index: number) => {

    const color = colors.find((c) => c.id === colorId);

    if (!color) return;

    const next = [...(color.secondary_images ?? [])];

    next.splice(index, 1);

    updateColor(colorId, { secondary_images: next });

  };



  return (

    <div className="space-y-4 sm:space-y-5">

      <div className="rounded-xl border border-primary/15 bg-primary-soft/25 p-3 text-center sm:rounded-2xl sm:p-4">

        <p className="text-sm font-semibold text-foreground">Colors & photos</p>

        <p className="mt-1 text-xs text-muted-foreground">

          Tap a color → add a photo. No typing needed.

        </p>

      </div>



      <div className="space-y-3 sm:space-y-4">

        {colors.map((color, index) => {

          const selectedPreset = presetForColor(color);

          const hasColor = Boolean(color.name.trim());

          const hasPhoto = Boolean(color.image_url);

          const isComplete = hasColor && hasPhoto;

          const displayName = color.name.trim() || `Color ${index + 1}`;



          return (

            <div

              key={color.id}

              className={cn(

                "rounded-xl border bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4",

                color.is_default ? "border-primary ring-2 ring-primary/15" : "border-border/60",

              )}

            >

              <div className="mb-3 flex items-center justify-between gap-2">

                <div className="flex min-w-0 items-center gap-2">

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">

                    {index + 1}

                  </span>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold">{displayName}</p>

                    <p className="text-[11px] text-muted-foreground">

                      {!hasColor && "Tap a color below"}

                      {hasColor && !hasPhoto && "Now add a photo"}

                      {isComplete && "Ready"}

                    </p>

                  </div>

                  {isComplete ? (

                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

                  ) : (

                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground/30" />

                  )}

                </div>

                <div className="flex shrink-0 items-center gap-1">

                  {color.is_default ? (

                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-[10px] font-medium text-primary">

                      <Star className="h-3 w-3 fill-primary" />

                      Shop

                    </span>

                  ) : (

                    <button

                      type="button"

                      onClick={() => setDefault(color.id)}

                      className="min-h-8 rounded-full bg-muted px-2 py-1 text-[10px] font-medium"

                    >

                      Shop

                    </button>

                  )}

                  {colors.length > 1 ? (

                    <button

                      type="button"

                      onClick={() => removeColor(color.id)}

                      className="grid h-9 w-9 place-items-center rounded-full text-destructive active:bg-destructive/10"

                      aria-label="Remove"

                    >

                      <Trash2 className="h-4 w-4" />

                    </button>

                  ) : null}

                </div>

              </div>



              <div className="mb-3 sm:mb-4">

                <p className="mb-2 text-xs font-medium text-foreground">

                  1. Tap this color <span className="text-destructive">*</span>

                </p>

                {/* Phone: horizontal swipe row */}

                <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 snap-x snap-mandatory sm:hidden">

                  {COLOR_PRESETS.map((preset) => (

                    <PresetButton

                      key={preset.id}

                      preset={preset}

                      selected={selectedPreset === preset.id}

                      onSelect={() => pickPreset(color.id, preset)}

                    />

                  ))}

                  <button

                    type="button"

                    onClick={() => customPickerRefs.current[color.id]?.click()}

                    className={cn(

                      "flex w-[4.5rem] shrink-0 snap-start flex-col items-center gap-1 rounded-xl border-2 p-2",

                      selectedPreset === "custom"

                        ? "border-primary bg-primary-soft/40"

                        : "border-transparent bg-muted/30",

                    )}

                  >

                    <span

                      className={cn(

                        "grid h-9 w-9 place-items-center rounded-full border-2 bg-white",

                        selectedPreset === "custom" ? "border-primary" : "border-border",

                      )}

                      style={

                        selectedPreset === "custom" && color.hex

                          ? { backgroundColor: color.hex }

                          : undefined

                      }

                    >

                      {selectedPreset !== "custom" ? (

                        <Palette className="h-4 w-4 text-muted-foreground" />

                      ) : null}

                    </span>

                    <span className="text-[10px] font-medium text-muted-foreground">Other</span>

                    <input

                      ref={(el) => {

                        customPickerRefs.current[color.id] = el;

                      }}

                      type="color"

                      className="sr-only"

                      value={

                        color.hex && /^#[0-9A-Fa-f]{6}$/i.test(color.hex) ? color.hex : "#E8B4B8"

                      }

                      onChange={(e) => pickCustom(color.id, e.target.value)}

                    />

                  </button>

                </div>

                {/* Tablet+ */}

                <div className="hidden grid-cols-4 gap-2 sm:grid">

                  {COLOR_PRESETS.map((preset) => (

                    <PresetButton

                      key={preset.id}

                      preset={preset}

                      selected={selectedPreset === preset.id}

                      onSelect={() => pickPreset(color.id, preset)}

                    />

                  ))}

                  <button

                    type="button"

                    onClick={() => customPickerRefs.current[color.id]?.click()}

                    className={cn(

                      "flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all",

                      selectedPreset === "custom"

                        ? "border-primary bg-primary-soft/40"

                        : "border-transparent bg-muted/30 hover:bg-muted/50",

                    )}

                  >

                    <span

                      className={cn(

                        "grid h-10 w-10 place-items-center rounded-full border-2 bg-white",

                        selectedPreset === "custom" ? "border-primary" : "border-border",

                      )}

                      style={

                        selectedPreset === "custom" && color.hex

                          ? { backgroundColor: color.hex }

                          : undefined

                      }

                    >

                      {selectedPreset !== "custom" ? (

                        <Palette className="h-4 w-4 text-muted-foreground" />

                      ) : null}

                    </span>

                    <span className="text-[10px] font-medium text-muted-foreground">Other</span>

                    <input

                      ref={(el) => {

                        customPickerRefs.current[color.id] = el;

                      }}

                      type="color"

                      className="sr-only"

                      value={

                        color.hex && /^#[0-9A-Fa-f]{6}$/i.test(color.hex) ? color.hex : "#E8B4B8"

                      }

                      onChange={(e) => pickCustom(color.id, e.target.value)}

                    />

                  </button>

                </div>

              </div>



              <div className="mb-3 sm:mb-4">

                <p className="mb-2 text-xs font-medium text-foreground">

                  2. Add photo <span className="text-destructive">*</span>

                </p>

                <button

                  type="button"

                  disabled={isUploading || !hasColor}

                  onClick={() => hasColor && fileRefs.current[color.id]?.click()}

                  className={cn(

                    "relative block w-full max-w-full overflow-hidden rounded-xl border-2 border-dashed transition-all sm:mx-auto sm:max-w-[220px] sm:rounded-2xl",

                    !hasColor && "cursor-not-allowed opacity-50",

                    color.image_url

                      ? "aspect-4/5 border-transparent"

                      : "aspect-4/5 border-primary/25 bg-muted/20 active:border-primary active:bg-primary-soft/20",

                  )}

                >

                  {color.image_url ? (

                    <>

                      <img src={color.image_url} alt="" className="h-full w-full object-cover" />

                      <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/55 py-2 text-center text-xs font-medium text-white">

                        Change photo

                      </span>

                    </>

                  ) : (

                    <span className="flex h-full flex-col items-center justify-center gap-2 p-4 sm:p-6">

                      <Upload className="h-9 w-9 text-primary sm:h-10 sm:w-10" />

                      <span className="text-sm font-medium">Tap to upload</span>

                    </span>

                  )}

                </button>

                <input

                  ref={(el) => {

                    fileRefs.current[color.id] = el;

                  }}

                  type="file"

                  accept="image/*"

                  className="hidden"

                  onChange={(e) => {

                    const file = e.target.files?.[0];

                    if (file) void uploadMain(color.id, file);

                    e.target.value = "";

                  }}

                />

              </div>



              <div>

                <p className="mb-2 text-xs text-muted-foreground">More photos (optional)</p>

                <div className="flex flex-wrap gap-2">

                  {(color.secondary_images ?? []).map((url, idx) => (

                    <div

                      key={`${color.id}-s-${idx}`}

                      className="group relative h-16 w-16 overflow-hidden rounded-xl border"

                    >

                      <img src={url} alt="" className="h-full w-full object-cover" />

                      <button

                        type="button"

                        onClick={() => removeSecondary(color.id, idx)}

                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"

                        aria-label="Remove photo"

                      >

                        ✕

                      </button>

                    </div>

                  ))}

                  {(color.secondary_images?.length ?? 0) < 5 ? (

                    <button

                      type="button"

                      disabled={isUploading || !hasPhoto}

                      onClick={() => secondaryRefs.current[color.id]?.click()}

                      className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/10 disabled:opacity-40"

                    >

                      <ImagePlus className="h-5 w-5 text-muted-foreground" />

                    </button>

                  ) : null}

                </div>

                <input

                  ref={(el) => {

                    secondaryRefs.current[color.id] = el;

                  }}

                  type="file"

                  accept="image/*"

                  multiple

                  className="hidden"

                  onChange={(e) => {

                    if (e.target.files?.length) void uploadSecondary(color.id, e.target.files);

                    e.target.value = "";

                  }}

                />

              </div>

            </div>

          );

        })}

      </div>



      <Button

        type="button"

        variant="outline"

        onClick={addColor}

        disabled={isUploading}

        className="min-h-11 w-full rounded-xl border-dashed py-5 text-base sm:rounded-2xl sm:py-6"

      >

        <Plus className="mr-2 h-5 w-5" />

        Add another color

      </Button>



      {colors.length === 0 ? (

        <Button

          type="button"

          onClick={() => onChange([createEmptyColor(true)])}

          className="min-h-11 w-full rounded-xl py-6 text-base sm:rounded-2xl sm:py-8"

        >

          <Plus className="mr-2 h-5 w-5" />

          Add first color

        </Button>

      ) : null}

    </div>

  );

}


