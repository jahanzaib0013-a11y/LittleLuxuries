import { cn } from "@/lib/utils";
import type { ProductColor } from "@/lib/product-colors";

type ProductColorSwatchesProps = {
  colors: ProductColor[];
  selectedId: string;
  onSelect: (color: ProductColor) => void;
  className?: string;
};

export function ProductColorSwatches({
  colors,
  selectedId,
  onSelect,
  className,
}: ProductColorSwatchesProps) {
  if (colors.length <= 1) return null;

  const selected = colors.find((c) => c.id === selectedId);

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium text-foreground">Choose a color</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tap a color to see its photos
          {selected?.name ? (
            <>
              {" "}
              — showing <span className="font-medium text-foreground">{selected.name}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Product colors">
        {colors.map((color) => {
          const isSelected = color.id === selectedId;
          const hasHex = color.hex && /^#[0-9A-Fa-f]{6}$/i.test(color.hex);
          return (
            <button
              key={color.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(color)}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-full border-2 px-3 py-2 text-sm transition-all",
                isSelected
                  ? "border-primary bg-primary-soft/50 font-medium text-primary shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/50",
              )}
            >
              <span
                className={cn(
                  "h-7 w-7 shrink-0 overflow-hidden rounded-full border-2",
                  isSelected ? "border-primary" : "border-border/60",
                  !hasHex && !color.image_url && "bg-muted",
                )}
                style={hasHex ? { backgroundColor: color.hex } : undefined}
              >
                {!hasHex && color.image_url ? (
                  <img src={color.image_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span>{color.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
