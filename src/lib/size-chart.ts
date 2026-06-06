/**
 * Advanced, fully-custom size chart model.
 *
 * A chart is a grid the admin builds themselves: any columns, any rows, any
 * values. One column is the "size" column (row labels, used to highlight the
 * shopper's selected size); the rest are "measure" columns whose numeric values
 * can be shown to customers in cm or inches.
 */

export type SizeChartColumnKind = "size" | "measure";

export type SizeChartColumn = {
  id: string;
  label: string;
  kind: SizeChartColumnKind;
};

export type SizeChartRow = {
  id: string;
  /** columnId -> raw text value (supports ranges, e.g. "86–92") */
  cells: Record<string, string>;
};

export type SizeChartUnit = "cm" | "in";

export type SizeChart = {
  /** Whether this product shows a size chart at all */
  enabled: boolean;
  columns: SizeChartColumn[];
  rows: SizeChartRow[];
  /** The unit the admin typed measurement values in */
  baseUnit: SizeChartUnit;
  /** Show a cm/inches switch to customers */
  allowUnitToggle: boolean;
  /** Optional "how to measure" guidance */
  howToMeasure: string;
  /** Optional uploaded measurement-guide image */
  measureImageUrl: string;
};

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${idCounter}`;
}

export function createColumn(label = "", kind: SizeChartColumnKind = "measure"): SizeChartColumn {
  return { id: uid("col"), label, kind };
}

export function createRow(columns: SizeChartColumn[]): SizeChartRow {
  const cells: Record<string, string> = {};
  columns.forEach((c) => {
    cells[c.id] = "";
  });
  return { id: uid("row"), cells };
}

/** A blank chart the admin can build from scratch. Disabled by default. */
export function createEmptySizeChart(): SizeChart {
  const size = createColumn("Size", "size");
  const chest = createColumn("Chest (cm)", "measure");
  const length = createColumn("Length (cm)", "measure");
  return {
    enabled: false,
    columns: [size, chest, length],
    rows: [],
    baseUnit: "cm",
    allowUnitToggle: true,
    howToMeasure: "",
    measureImageUrl: "",
  };
}

function isUnit(value: unknown): value is SizeChartUnit {
  return value === "cm" || value === "in";
}

/** Robustly parse a chart from JSONB (or anything) coming out of the DB. */
export function parseSizeChart(raw: unknown): SizeChart {
  const base = createEmptySizeChart();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const obj = raw as Record<string, unknown>;

  const columns: SizeChartColumn[] = Array.isArray(obj.columns)
    ? obj.columns
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const c = entry as Record<string, unknown>;
          const id = typeof c.id === "string" ? c.id : uid("col");
          const label = typeof c.label === "string" ? c.label : "";
          const kind: SizeChartColumnKind = c.kind === "size" ? "size" : "measure";
          return { id, label, kind } satisfies SizeChartColumn;
        })
        .filter((c): c is SizeChartColumn => c !== null)
    : base.columns;

  // Guarantee exactly-one (or at least, a sensible) size column.
  const validColumns = columns.length > 0 ? columns : base.columns;
  const hasSize = validColumns.some((c) => c.kind === "size");
  if (!hasSize && validColumns[0]) validColumns[0].kind = "size";

  const rows: SizeChartRow[] = Array.isArray(obj.rows)
    ? obj.rows
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const r = entry as Record<string, unknown>;
          const id = typeof r.id === "string" ? r.id : uid("row");
          const cells: Record<string, string> = {};
          const rawCells =
            r.cells && typeof r.cells === "object" ? (r.cells as Record<string, unknown>) : {};
          // Only keep cells for columns that still exist (drops stray data).
          validColumns.forEach((col) => {
            const v = rawCells[col.id];
            cells[col.id] = typeof v === "string" ? v : v == null ? "" : String(v);
          });
          return { id, cells } satisfies SizeChartRow;
        })
        .filter((r): r is SizeChartRow => r !== null)
    : [];

  return {
    enabled: Boolean(obj.enabled),
    columns: validColumns,
    rows,
    baseUnit: isUnit(obj.baseUnit) ? obj.baseUnit : "cm",
    allowUnitToggle: obj.allowUnitToggle !== false,
    howToMeasure: typeof obj.howToMeasure === "string" ? obj.howToMeasure : "",
    measureImageUrl: typeof obj.measureImageUrl === "string" ? obj.measureImageUrl : "",
  };
}

/** Does the chart have enough content to be worth showing/saving? */
export function isSizeChartMeaningful(chart: SizeChart): boolean {
  if (!chart.enabled) return false;
  if (chart.columns.length === 0 || chart.rows.length === 0) return false;
  return chart.rows.some((row) =>
    chart.columns.some((col) => (row.cells[col.id] ?? "").trim() !== ""),
  );
}

function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/**
 * Convert every numeric token inside a cell from one unit to another, leaving
 * the surrounding text (ranges, slashes, labels) intact.
 * e.g. "86–92" cm → in becomes "33.9–36.2".
 */
export function convertCellValue(text: string, from: SizeChartUnit, to: SizeChartUnit): string {
  if (from === to || !text) return text;
  const factor = from === "cm" && to === "in" ? 1 / 2.54 : 2.54;
  return text.replace(/\d+(\.\d+)?/g, (match) => {
    const value = parseFloat(match);
    if (Number.isNaN(value)) return match;
    const converted = roundTo(value * factor, 1);
    return String(converted);
  });
}

export function getSizeColumn(chart: SizeChart): SizeChartColumn | null {
  return chart.columns.find((c) => c.kind === "size") ?? chart.columns[0] ?? null;
}

// Units that are NOT cm↔inch convertible lengths (weight, regional sizing, age…).
const NON_LENGTH = /(kg|gram|\bg\b|lbs?|oz|\beu\b|\bus\b|\buk\b|age|month|year|\byr\b|%|weight)/i;
const LENGTH =
  /(cm|centimet|inch|inches|\bin\b|"|mm|metre|meter|length|chest|waist|hip|sleeve|inseam|height|shoulder|width)/i;

/**
 * Whether a measurement column's numbers can be shown in cm or inches.
 * Weight / EU / age columns are left untouched by the unit toggle.
 */
export function isConvertibleColumn(column: SizeChartColumn): boolean {
  if (column.kind !== "measure") return false;
  if (NON_LENGTH.test(column.label)) return false;
  // Has a length cue, or no unit at all (charts are lengths by default).
  return LENGTH.test(column.label) || !/\(.*\)/.test(column.label);
}

const TRAILING_UNIT = /\s*\((?:cm|centimet(?:re|er)s?|in|inch|inches|mm)\)\s*$/i;

/** Header label with its unit suffix reflecting the active display unit. */
export function displayHeaderLabel(column: SizeChartColumn, unit: SizeChartUnit): string {
  if (!isConvertibleColumn(column)) return column.label;
  const base = column.label.replace(TRAILING_UNIT, "").trim();
  if (!base) return unit === "cm" ? "cm" : "in";
  return `${base} (${unit === "cm" ? "cm" : "in"})`;
}

/** A cell's value rendered in the active display unit (only length columns convert). */
export function displayCellValue(
  column: SizeChartColumn,
  value: string,
  baseUnit: SizeChartUnit,
  unit: SizeChartUnit,
): string {
  if (!isConvertibleColumn(column)) return value;
  return convertCellValue(value, baseUnit, unit);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export type SizeChartTemplate = {
  id: string;
  name: string;
  builtin?: boolean;
  /** The chart shape this template applies (everything except `enabled`). */
  chart: Omit<SizeChart, "enabled">;
};

/**
 * A template is a measurement *layout* only — columns + display settings, no
 * sizes. Sizes always come from the product the template is applied to.
 */
function makeTemplateChart(
  columnLabels: { label: string; kind?: SizeChartColumnKind }[],
): Omit<SizeChart, "enabled"> {
  const columns = columnLabels.map((c, i) =>
    createColumn(c.label, c.kind ?? (i === 0 ? "size" : "measure")),
  );
  return {
    columns,
    rows: [],
    baseUnit: "cm",
    allowUnitToggle: true,
    howToMeasure: "",
    measureImageUrl: "",
  };
}

/** Common starting layouts. Each product's own sizes fill the rows on load. */
export const BUILTIN_SIZE_CHART_TEMPLATES: SizeChartTemplate[] = [
  {
    id: "builtin-onesie",
    name: "Bodysuit / Onesie",
    builtin: true,
    chart: makeTemplateChart([
      { label: "Size" },
      { label: "Chest (cm)" },
      { label: "Body Length (cm)" },
      { label: "Sleeve (cm)" },
    ]),
  },
  {
    id: "builtin-tops",
    name: "Knitwear / Tops",
    builtin: true,
    chart: makeTemplateChart([
      { label: "Size" },
      { label: "Chest (cm)" },
      { label: "Length (cm)" },
      { label: "Sleeve (cm)" },
    ]),
  },
  {
    id: "builtin-bottoms",
    name: "Bottoms / Leggings",
    builtin: true,
    chart: makeTemplateChart([
      { label: "Size" },
      { label: "Waist (cm)" },
      { label: "Hip (cm)" },
      { label: "Inseam (cm)" },
      { label: "Length (cm)" },
    ]),
  },
  {
    id: "builtin-footwear",
    name: "Booties / Footwear",
    builtin: true,
    chart: makeTemplateChart([{ label: "Size" }, { label: "Foot Length (cm)" }, { label: "EU" }]),
  },
  {
    id: "builtin-age-grid",
    name: "Age → Height & Weight",
    builtin: true,
    chart: makeTemplateChart([
      { label: "Size" },
      { label: "Height (cm)" },
      { label: "Weight (kg)" },
    ]),
  },
];

/** Deep-clone a template's chart and give all columns/rows fresh ids. */
export function instantiateTemplate(template: SizeChartTemplate): Omit<SizeChart, "enabled"> {
  const idMap = new Map<string, string>();
  const columns = template.chart.columns.map((col) => {
    const fresh = createColumn(col.label, col.kind);
    idMap.set(col.id, fresh.id);
    return fresh;
  });
  const rows = template.chart.rows.map((row) => {
    const cells: Record<string, string> = {};
    columns.forEach((col) => {
      cells[col.id] = "";
    });
    Object.entries(row.cells).forEach(([oldId, value]) => {
      const newId = idMap.get(oldId);
      if (newId) cells[newId] = value;
    });
    return { id: uid("row"), cells } satisfies SizeChartRow;
  });
  return {
    columns,
    rows,
    baseUnit: template.chart.baseUnit,
    allowUnitToggle: template.chart.allowUnitToggle,
    howToMeasure: template.chart.howToMeasure,
    measureImageUrl: template.chart.measureImageUrl,
  };
}
