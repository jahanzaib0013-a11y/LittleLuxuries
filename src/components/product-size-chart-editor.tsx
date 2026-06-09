import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Plus,
  Ruler,
  Save,
  Star,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { imageService } from "@/lib/image-service";
import { useSizeChartTemplates } from "@/hooks/use-size-chart-templates";
import {
  createColumn,
  createRow,
  getSizeColumn,
  instantiateTemplate,
  type SizeChart,
  type SizeChartColumn,
  type SizeChartRow,
} from "@/lib/size-chart";
import {
  GarmentDiagramView,
  guideKeyForLabel,
  pickDiagram,
  type GuideKey,
} from "@/lib/size-chart-diagrams";

type ProductSizeChartEditorProps = {
  value: SizeChart;
  onChange: (chart: SizeChart) => void;
  /** The sizes selected for this product — the chart's rows mirror these. */
  productSizes: string[];
  /** Product category — used to recommend a garment layout & diagram. */
  category?: string;
  isUploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
};

const cellInputClass =
  "h-10 w-full min-w-[7rem] rounded-lg border border-border/50 bg-white px-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function ProductSizeChartEditor({
  value,
  onChange,
  productSizes,
  category,
  isUploading,
  onUploadingChange,
}: ProductSizeChartEditorProps) {
  const { templates, customTemplates, saveTemplate, removeTemplate } = useSizeChartTemplates();
  const measureImageRef = useRef<HTMLInputElement>(null);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [activeKey, setActiveKey] = useState<GuideKey | null>(null);

  const patch = (updates: Partial<SizeChart>) => onChange({ ...value, ...updates });

  const sizeColumn = getSizeColumn(value);
  const measurementCount = value.columns.filter((c) => c.kind === "measure").length;
  // When the product has sizes, those sizes drive the chart's rows (read-only).
  // With no product sizes we fall back to free-form rows the admin manages here.
  const mapped = productSizes.some((s) => s.trim());

  // The garment diagram recommended for this product (by category, then columns).
  const diagram = pickDiagram(
    category ?? "",
    value.columns.filter((c) => c.kind === "measure").map((c) => c.label),
  );
  // Map current measurement columns to diagram guide letters (A/B/C…).
  const diagramLetters: Partial<Record<GuideKey, string>> = {};
  let letterIdx = 0;
  for (const col of value.columns) {
    if (col.kind !== "measure") continue;
    const key = guideKeyForLabel(col.label);
    if (!key || !diagram.guides.some((g) => g.key === key) || diagramLetters[key]) continue;
    diagramLetters[key] = String.fromCharCode(65 + letterIdx);
    letterIdx += 1;
  }

  /** Build a chart from the garment's recommended columns + the product's sizes. */
  const buildRecommended = (): Pick<
    SizeChart,
    "columns" | "rows" | "baseUnit" | "allowUnitToggle"
  > => {
    const size = createColumn("Size", "size");
    const columns = [
      size,
      ...diagram.recommendedColumns.map((label) => createColumn(label, "measure")),
    ];
    const want = productSizes.map((s) => s.trim()).filter(Boolean);
    const rows = want.map((s) => {
      const row = createRow(columns);
      row.cells[size.id] = s;
      return row;
    });
    return { columns, rows, baseUnit: "cm", allowUnitToggle: true };
  };

  const applyRecommended = () => {
    onChange({ ...value, enabled: true, ...buildRecommended() });
    toast.success(`Applied the recommended ${diagram.name.toLowerCase()} layout`);
  };

  // Keep the chart's rows in lock-step with the product's selected sizes:
  // add new sizes, drop removed ones, match order — preserving any measurement
  // values already typed for a size (matched by its label).
  useEffect(() => {
    if (!value.enabled) return;
    const sc = getSizeColumn(value);
    if (!sc) return;
    const want = productSizes.map((s) => s.trim()).filter(Boolean);
    if (want.length === 0) return; // manual mode — leave rows alone

    const current = value.rows.map((r) => (r.cells[sc.id] ?? "").trim());
    const inSync =
      current.length === want.length &&
      current.every((l, i) => l.toLowerCase() === want[i].toLowerCase());
    if (inSync) return;

    const byLabel = new Map<string, SizeChartRow>();
    value.rows.forEach((r) => {
      const key = (r.cells[sc.id] ?? "").trim().toLowerCase();
      if (key && !byLabel.has(key)) byLabel.set(key, r);
    });

    const nextRows: SizeChartRow[] = want.map((size) => {
      const existing = byLabel.get(size.toLowerCase());
      const cells: Record<string, string> = {};
      value.columns.forEach((c) => {
        cells[c.id] = c.id === sc.id ? size : (existing?.cells[c.id] ?? "");
      });
      return { id: existing?.id ?? createRow(value.columns).id, cells };
    });

    onChange({ ...value, rows: nextRows });
    // Re-run only when the product's sizes change or the chart is toggled on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSizes, value.enabled]);

  // ---- columns -----------------------------------------------------------
  const renameColumn = (id: string, label: string) => {
    patch({ columns: value.columns.map((c) => (c.id === id ? { ...c, label } : c)) });
  };

  const setColumnKind = (id: string, kind: SizeChartColumn["kind"]) => {
    let columns = value.columns.map((c) => (c.id === id ? { ...c, kind } : c));
    if (kind === "size") {
      columns = columns.map((c) =>
        c.id !== id && c.kind === "size" ? { ...c, kind: "measure" } : c,
      );
    } else if (!columns.some((c) => c.kind === "size") && columns[0]) {
      columns = columns.map((c, i) => (i === 0 ? { ...c, kind: "size" } : c));
    }
    patch({ columns });
  };

  const moveColumn = (id: string, dir: -1 | 1) => {
    const idx = value.columns.findIndex((c) => c.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= value.columns.length) return;
    const columns = [...value.columns];
    [columns[idx], columns[target]] = [columns[target], columns[idx]];
    patch({ columns });
  };

  const addColumn = () => {
    const col = createColumn(`Measurement ${value.columns.length}`, "measure");
    const rows = value.rows.map((r) => ({ ...r, cells: { ...r.cells, [col.id]: "" } }));
    patch({ columns: [...value.columns, col], rows });
  };

  const removeColumn = (id: string) => {
    if (value.columns.length <= 1) {
      toast.error("Keep at least one column");
      return;
    }
    const removed = value.columns.find((c) => c.id === id);
    const columns = value.columns.filter((c) => c.id !== id);
    if (removed?.kind === "size" && !columns.some((c) => c.kind === "size") && columns[0]) {
      columns[0] = { ...columns[0], kind: "size" };
    }
    const rows = value.rows.map((r) => {
      const cells = { ...r.cells };
      delete cells[id];
      return { ...r, cells };
    });
    patch({ columns, rows });
  };

  // ---- rows (manual mode only) -------------------------------------------
  const setCell = (rowId: string, columnId: string, cellValue: string) => {
    patch({
      rows: value.rows.map((r) =>
        r.id === rowId ? { ...r, cells: { ...r.cells, [columnId]: cellValue } } : r,
      ),
    });
  };

  const addRow = () => patch({ rows: [...value.rows, createRow(value.columns)] });

  const removeRow = (rowId: string) => patch({ rows: value.rows.filter((r) => r.id !== rowId) });

  const moveRow = (rowId: string, dir: -1 | 1) => {
    const idx = value.rows.findIndex((r) => r.id === rowId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= value.rows.length) return;
    const rows = [...value.rows];
    [rows[idx], rows[target]] = [rows[target], rows[idx]];
    patch({ rows });
  };

  // ---- templates (measurement layouts only) ------------------------------
  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const fresh = instantiateTemplate(template); // columns + settings, no sizes
    const sc = fresh.columns.find((c) => c.kind === "size") ?? fresh.columns[0];
    const want = productSizes.map((s) => s.trim()).filter(Boolean);
    const rows =
      sc && want.length > 0
        ? want.map((size) => {
            const row = createRow(fresh.columns);
            row.cells[sc.id] = size;
            return row;
          })
        : fresh.rows;
    onChange({ ...value, enabled: true, ...fresh, rows });
    toast.success(`Loaded “${template.name}” layout`);
  };

  // Start a brand-new template from a clean grid: one Size column + one blank
  // measurement column for the admin to label and fill, then save.
  const startNewTemplate = () => {
    const size = createColumn("Size", "size");
    const measure = createColumn("", "measure");
    const columns = [size, measure];
    const want = productSizes.map((s) => s.trim()).filter(Boolean);
    const rows = want.map((s) => {
      const row = createRow(columns);
      row.cells[size.id] = s;
      return row;
    });
    onChange({
      ...value,
      enabled: true,
      columns,
      rows,
      baseUnit: "cm",
      allowUnitToggle: true,
      howToMeasure: "",
      measureImageUrl: "",
    });
    setTemplateName("");
    setShowSaveTemplate(true);
  };

  const handleSaveTemplate = () => {
    const name = templateName.trim();
    if (!name) {
      toast.error("Name this template first");
      return;
    }
    // Templates store the layout only — sizes come from each product on load.
    saveTemplate(name, { ...value, rows: [] });
    setTemplateName("");
    setShowSaveTemplate(false);
    toast.success(`Saved “${name}” — reuse it on any product`);
  };

  // ---- measurement guide image ------------------------------------------
  const uploadMeasureImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Use a JPG or PNG image");
      return;
    }
    onUploadingChange(true);
    try {
      const url = await imageService.uploadImage(file);
      patch({ measureImageUrl: url });
      toast.success("Guide image added");
    } catch {
      toast.error("Upload failed — try again");
    } finally {
      onUploadingChange(false);
    }
  };

  // ---- disabled state ----------------------------------------------------
  if (!value.enabled) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary-soft/15 p-5 text-center sm:p-6">
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
          <Ruler className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">Size chart</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Show shoppers a measurement chart with a labelled garment diagram on the product page.
        </p>
        <div className="mx-auto mt-3 max-w-[120px] opacity-70">
          <GarmentDiagramView
            diagram={diagram}
            letters={Object.fromEntries(
              diagram.recommendedColumns
                .map((l) => guideKeyForLabel(l))
                .filter((k): k is GuideKey => Boolean(k))
                .map((k, i) => [k, String.fromCharCode(65 + i)]),
            )}
            activeKey={null}
            onHover={() => {}}
          />
        </div>
        <Button
          type="button"
          onClick={applyRecommended}
          className="mt-4 min-h-11 rounded-full px-6 text-sm font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a size chart
        </Button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Applies the recommended <span className="font-semibold">{diagram.name}</span> layout
          {mapped ? ` with your ${productSizes.filter((s) => s.trim()).length} sizes` : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary">
            <Ruler className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Size chart</p>
            <p className="text-[11px] text-muted-foreground">
              {value.rows.length} size{value.rows.length === 1 ? "" : "s"} · {measurementCount}{" "}
              measurement{measurementCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => patch({ enabled: false })}
          className="h-8 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-destructive"
        >
          Remove chart
        </Button>
      </div>

      {/* Recommended garment diagram preview */}
      {Object.keys(diagramLetters).length > 0 && (
        <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-muted/10 p-3 sm:p-4">
          <div className="w-[90px] shrink-0 sm:w-[110px]">
            <GarmentDiagramView
              diagram={diagram}
              letters={diagramLetters}
              activeKey={activeKey}
              onHover={setActiveKey}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60">
              {diagram.name} diagram
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Shoppers see this auto-generated diagram — no image upload needed. Each measurement
              column is marked A/B/C on the garment. Hover a measurement to preview it.
            </p>
          </div>
        </div>
      )}

      {/* Templates (measurement layouts) */}
      <div className="rounded-2xl border border-border/50 bg-muted/10 p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60">
            Start from a template
          </p>
          {!showSaveTemplate && (
            <Button
              type="button"
              variant="outline"
              onClick={startNewTemplate}
              className="h-8 rounded-full border-dashed px-3 text-xs font-medium"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New template
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <span key={t.id} className="group relative inline-flex">
              <button
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-soft/30"
              >
                {t.builtin ? (
                  <Ruler className="h-3 w-3 text-primary/60" />
                ) : (
                  <Save className="h-3 w-3 text-primary/60" />
                )}
                {t.name}
              </button>
              {!t.builtin && (
                <button
                  type="button"
                  onClick={() => {
                    removeTemplate(t.id);
                    toast.success("Template deleted");
                  }}
                  className="absolute -right-1 -top-1 hidden h-4 w-4 place-items-center rounded-full bg-destructive text-white group-hover:grid"
                  aria-label={`Delete ${t.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          ))}
        </div>
        {customTemplates.length === 0 && !showSaveTemplate && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            A template saves your measurement columns (not sizes). Tap “New template” to reuse this
            layout on other products.
          </p>
        )}

        {/* Save the current layout as a new template */}
        {showSaveTemplate && (
          <div className="mt-3 space-y-2 rounded-xl border border-border/50 bg-white p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name, e.g. Onesies cm"
                autoFocus
                className="h-10 flex-1 rounded-xl border-border/50 bg-white text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="h-10 rounded-full px-5 text-sm font-semibold"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setTemplateName("");
                  }}
                  className="h-10 rounded-full px-4 text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Build your measurement columns in the grid below, then Save. Only the columns and
              settings are stored — each product&apos;s own sizes fill the rows automatically.
            </p>
          </div>
        )}
      </div>

      {/* Mapping note + actions */}
      {mapped ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/15 bg-primary-soft/15 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            <Tag className="mr-1 inline h-3 w-3 text-primary" />
            Sizes mirror the product&apos;s sizes. Add or remove them in{" "}
            <span className="font-semibold text-foreground">Sizing</span> above.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={addColumn}
            className="h-9 rounded-full border-dashed px-3 text-xs font-medium"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add measurement
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={addRow}
            className="h-9 rounded-full px-4 text-xs font-semibold"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add size
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={addColumn}
            className="h-9 rounded-full border-dashed px-3 text-xs font-medium"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add measurement
          </Button>
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/30">
              {value.columns.map((col, colIdx) => {
                const isSize = col.kind === "size";
                const gKey = !isSize ? guideKeyForLabel(col.label) : null;
                const letter =
                  gKey && diagram.guides.some((g) => g.key === gKey)
                    ? diagramLetters[gKey]
                    : undefined;
                const isActive = Boolean(gKey) && activeKey === gKey;
                return (
                  <th
                    key={col.id}
                    onMouseEnter={() => gKey && setActiveKey(gKey)}
                    onMouseLeave={() => gKey && setActiveKey(null)}
                    className="border-b border-border/50 p-2 align-top"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold",
                            isSize
                              ? "bg-primary text-white"
                              : isActive
                                ? "bg-primary text-white"
                                : "bg-primary-soft/60 text-primary",
                          )}
                          title={isSize ? "Size column" : "Measurement column"}
                        >
                          {isSize ? (
                            <Tag className="h-3 w-3" />
                          ) : letter ? (
                            letter
                          ) : (
                            <Ruler className="h-3 w-3" />
                          )}
                        </span>
                        <Input
                          value={col.label}
                          onChange={(e) => renameColumn(col.id, e.target.value)}
                          placeholder={isSize ? "Size" : "Measurement"}
                          className="h-9 min-w-[7rem] rounded-lg border-border/50 bg-white text-sm font-semibold"
                        />
                      </div>
                      {/* The size column is driven by the product; only let it be
                          renamed, not deleted/reassigned, when mapped. */}
                      {!(mapped && isSize) && (
                        <div className="flex items-center justify-center gap-0.5">
                          <IconBtn
                            title={isSize ? "Size column" : "Make this the Size column"}
                            active={isSize}
                            onClick={() => setColumnKind(col.id, isSize ? "measure" : "size")}
                          >
                            <Star className={cn("h-3.5 w-3.5", isSize && "fill-current")} />
                          </IconBtn>
                          <IconBtn
                            title="Move left"
                            disabled={colIdx === 0}
                            onClick={() => moveColumn(col.id, -1)}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </IconBtn>
                          <IconBtn
                            title="Move right"
                            disabled={colIdx === value.columns.length - 1}
                            onClick={() => moveColumn(col.id, 1)}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </IconBtn>
                          <IconBtn
                            title="Delete column"
                            destructive
                            disabled={value.columns.length <= 1}
                            onClick={() => removeColumn(col.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconBtn>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
              {!mapped && (
                <th className="border-b border-l border-border/50 p-2 align-middle">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Edit
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row, rowIdx) => (
              <tr key={row.id} className="even:bg-muted/10">
                {value.columns.map((col) => {
                  const isSizeCell = col.id === sizeColumn?.id;
                  if (isSizeCell && mapped) {
                    return (
                      <td key={col.id} className="p-1.5 align-middle">
                        <div
                          className={cn(
                            cellInputClass,
                            "flex cursor-default items-center bg-muted/30 font-semibold text-foreground",
                          )}
                          title="Set by the product's sizes"
                        >
                          {row.cells[col.id] || "—"}
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={col.id} className="p-1.5 align-middle">
                      <input
                        value={row.cells[col.id] ?? ""}
                        onChange={(e) => setCell(row.id, col.id, e.target.value)}
                        inputMode={col.kind === "measure" ? "decimal" : "text"}
                        placeholder={col.kind === "size" ? "e.g. 0–3M" : "e.g. 86 or 86–92"}
                        className={cn(cellInputClass, col.kind === "size" && "font-semibold")}
                      />
                    </td>
                  );
                })}
                {!mapped && (
                  <td className="border-l border-border/40 p-1.5 align-middle">
                    <div className="flex items-center justify-center gap-0.5">
                      <IconBtn
                        title="Move up"
                        disabled={rowIdx === 0}
                        onClick={() => moveRow(row.id, -1)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn
                        title="Move down"
                        disabled={rowIdx === value.rows.length - 1}
                        onClick={() => moveRow(row.id, 1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn title="Delete row" destructive onClick={() => removeRow(row.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {value.rows.length === 0 && (
              <tr>
                <td colSpan={value.columns.length + (mapped ? 0 : 1)} className="p-6 text-center">
                  {mapped ? (
                    <p className="text-sm text-muted-foreground">
                      Pick sizes for the product (in Sizing above) to fill the rows.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">No sizes yet.</p>
                      <button
                        type="button"
                        onClick={addRow}
                        className="mt-1 text-xs font-medium text-primary hover:underline"
                      >
                        Add a size
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Units */}
      <div className="grid gap-3 rounded-2xl border border-border/50 bg-muted/10 p-3 sm:grid-cols-2 sm:p-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-primary/60">
            Measurements entered in
          </p>
          <div className="inline-flex rounded-full border border-border/60 bg-white p-1">
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => patch({ baseUnit: u })}
                className={cn(
                  "min-w-[3.5rem] rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  value.baseUnit === u
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {u === "cm" ? "cm" : "inches"}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-white p-3">
          <input
            type="checkbox"
            checked={value.allowUnitToggle}
            onChange={(e) => patch({ allowUnitToggle: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              Let shoppers switch cm / inches
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Length numbers convert automatically — ranges included. Weight / EU columns stay
              as-is.
            </span>
          </span>
        </label>
      </div>

      {/* How to measure */}
      <div className="space-y-3 rounded-2xl border border-border/50 bg-muted/10 p-3 sm:p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60">
          How to measure (optional)
        </p>
        <Textarea
          value={value.howToMeasure}
          onChange={(e) => patch({ howToMeasure: e.target.value })}
          placeholder="e.g. Lay the garment flat and measure chest from armpit to armpit…"
          className="min-h-[72px] resize-none rounded-xl border-none bg-white text-sm focus:ring-2 focus:ring-primary/20"
        />
        <div>
          {value.measureImageUrl ? (
            <div className="relative inline-block">
              <img
                src={value.measureImageUrl}
                alt="Measurement guide"
                className="max-h-40 rounded-xl border border-border/50 object-contain"
              />
              <button
                type="button"
                onClick={() => patch({ measureImageUrl: "" })}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-white shadow"
                aria-label="Remove guide image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => measureImageRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/25 bg-white px-4 py-3 text-sm font-medium text-primary disabled:opacity-50"
            >
              {isUploading ? (
                <Upload className="h-4 w-4 animate-pulse" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              {isUploading ? "Uploading…" : "Add a measurement guide image"}
            </button>
          )}
          <input
            ref={measureImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadMeasureImage(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  active,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md transition-colors disabled:opacity-30",
        active
          ? "bg-primary text-white"
          : destructive
            ? "text-destructive hover:bg-destructive/10"
            : "text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
