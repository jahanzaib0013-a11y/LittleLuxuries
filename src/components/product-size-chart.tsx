import { useMemo, useState } from "react";
import { Ruler, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  displayCellValue,
  displayHeaderLabel,
  getSizeColumn,
  isSizeChartMeaningful,
  type SizeChart,
  type SizeChartUnit,
} from "@/lib/size-chart";
import {
  GarmentDiagramView,
  guideKeyForLabel,
  pickDiagram,
  type GuideKey,
} from "@/lib/size-chart-diagrams";

type ProductSizeChartProps = {
  chart: SizeChart;
  /** The size the shopper currently has selected — highlighted in the table. */
  selectedSize?: string;
  /** Product category — used to auto-pick the garment diagram. */
  category?: string;
  className?: string;
};

/** Customer-facing size guide: a refined trigger that opens the chart in a dialog. */
export function ProductSizeChart({
  chart,
  selectedSize,
  category,
  className,
}: ProductSizeChartProps) {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<SizeChartUnit>(chart.baseUnit);
  const [activeKey, setActiveKey] = useState<GuideKey | null>(null);

  const sizeColumn = getSizeColumn(chart);
  const measureColumns = useMemo(
    () => chart.columns.filter((c) => c.kind === "measure"),
    [chart.columns],
  );

  // Pick a garment diagram and assign A/B/C letters to the columns that map to
  // one of its guide lines.
  const { diagram, letters, columnLetter, columnKey } = useMemo(() => {
    const d = pickDiagram(
      category ?? "",
      measureColumns.map((c) => c.label),
    );
    const letters: Partial<Record<GuideKey, string>> = {};
    const columnLetter = new Map<string, string>();
    const columnKey = new Map<string, GuideKey>();
    let i = 0;
    for (const col of measureColumns) {
      const key = guideKeyForLabel(col.label);
      if (!key || !d.guides.some((g) => g.key === key)) continue;
      columnKey.set(col.id, key);
      if (!letters[key]) {
        const letter = String.fromCharCode(65 + i);
        i += 1;
        letters[key] = letter;
      }
      columnLetter.set(col.id, letters[key]!);
    }
    return { diagram: d, letters, columnLetter, columnKey };
  }, [category, measureColumns]);

  if (!isSizeChartMeaningful(chart)) return null;

  const normalizedSelected = selectedSize?.trim().toLowerCase();
  const showDiagram = Object.keys(letters).length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-foreground shadow-(--shadow-soft) transition-all hover:border-primary hover:text-primary",
          className,
        )}
      >
        <Ruler className="h-3.5 w-3.5" />
        Size guide
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-y-auto rounded-[28px] border-none p-0 shadow-2xl">
          <DialogClose className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-muted-foreground shadow-(--shadow-soft) backdrop-blur transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-5 space-y-3 text-left">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/50">
                    Fit &amp; Measurements
                  </p>
                  <DialogTitle className="font-serif text-2xl text-foreground sm:text-3xl">
                    Size Guide
                  </DialogTitle>
                </div>
                {chart.allowUnitToggle && (
                  <div className="inline-flex rounded-full border border-border bg-muted/30 p-1">
                    {(["cm", "in"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={cn(
                          "min-w-[3.75rem] rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all",
                          unit === u
                            ? "bg-primary text-primary-foreground shadow-(--shadow-soft)"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {u === "cm" ? "cm" : "inches"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Garment diagram */}
              {showDiagram && (
                <div className="lg:w-[170px] lg:shrink-0">
                  <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <div className="mx-auto max-w-[150px]">
                      <GarmentDiagramView
                        diagram={diagram}
                        letters={letters}
                        activeKey={activeKey}
                        onHover={setActiveKey}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Tap a measurement to see where it&apos;s taken.
                  </p>
                </div>
              )}

              {/* Table */}
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden rounded-2xl border border-border shadow-(--shadow-soft)">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary-soft/60">
                          {chart.columns.map((col, i) => {
                            const letter = columnLetter.get(col.id);
                            const key = columnKey.get(col.id);
                            return (
                              <th
                                key={col.id}
                                onMouseEnter={() => key && setActiveKey(key)}
                                onMouseLeave={() => key && setActiveKey(null)}
                                onClick={() => key && setActiveKey(key)}
                                className={cn(
                                  "whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors",
                                  key ? "cursor-pointer" : "",
                                  key && activeKey === key
                                    ? "bg-primary/15 text-primary"
                                    : "text-primary",
                                  i === 0 && "sticky left-0 z-10 bg-primary-soft/60",
                                )}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  {letter && (
                                    <span
                                      className={cn(
                                        "grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold",
                                        activeKey === key
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-primary/15 text-primary",
                                      )}
                                    >
                                      {letter}
                                    </span>
                                  )}
                                  {displayHeaderLabel(col, unit)}
                                </span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {chart.rows.map((row, rowIdx) => {
                          const rowSize = sizeColumn ? (row.cells[sizeColumn.id] ?? "").trim() : "";
                          const isSelected =
                            Boolean(normalizedSelected) &&
                            rowSize.toLowerCase() === normalizedSelected;
                          return (
                            <tr
                              key={row.id}
                              className={cn(
                                "border-t border-border/50 transition-colors",
                                isSelected
                                  ? "bg-primary/[0.07]"
                                  : rowIdx % 2 === 1
                                    ? "bg-muted/15"
                                    : "bg-card",
                              )}
                            >
                              {chart.columns.map((col, i) => {
                                const raw = row.cells[col.id] ?? "";
                                const isSizeCell = col.id === sizeColumn?.id;
                                const key = columnKey.get(col.id);
                                return (
                                  <td
                                    key={col.id}
                                    className={cn(
                                      "relative whitespace-nowrap px-4 py-3.5 text-foreground",
                                      isSizeCell && "font-semibold",
                                      key && activeKey === key && "bg-primary/[0.06]",
                                      i === 0 &&
                                        "sticky left-0 z-10 " +
                                          (isSelected
                                            ? "bg-[oklch(0.97_0.02_20)]"
                                            : rowIdx % 2 === 1
                                              ? "bg-muted/15"
                                              : "bg-card"),
                                      isSelected && isSizeCell && "text-primary",
                                    )}
                                  >
                                    {isSelected && i === 0 && (
                                      <span className="absolute inset-y-0 left-0 w-1 bg-primary" />
                                    )}
                                    <span className="inline-flex items-center gap-2">
                                      {isSizeCell
                                        ? raw
                                        : displayCellValue(col, raw, chart.baseUnit, unit)}
                                      {isSelected && isSizeCell && (
                                        <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                                          Your size
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {(chart.howToMeasure.trim() || chart.measureImageUrl) && (
              <div className="mt-6 space-y-3 rounded-2xl border border-border/50 bg-muted/20 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary/60">
                  How to measure
                </p>
                {chart.howToMeasure.trim() && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {chart.howToMeasure}
                  </p>
                )}
                {chart.measureImageUrl && (
                  <img
                    src={chart.measureImageUrl}
                    alt="How to measure"
                    className="max-h-72 w-full rounded-xl object-contain"
                  />
                )}
              </div>
            )}

            <p className="mt-5 text-center text-[11px] italic text-muted-foreground">
              Measurements are approximate and may vary by ±1–2 {unit === "cm" ? "cm" : "in"}.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
