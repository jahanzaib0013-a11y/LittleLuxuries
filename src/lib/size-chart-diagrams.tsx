/**
 * Garment measurement diagrams. Clean SVG line-art per clothing type with
 * labelled guide lines (A/B/C…) that cross-reference the size-chart columns.
 * The right diagram is chosen automatically from the product category and the
 * chart's column labels — no admin setup.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GuideKey =
  | "shoulder"
  | "chest"
  | "waist"
  | "hip"
  | "inseam"
  | "length"
  | "sleeve"
  | "foot"
  | "width"
  | "height"
  | "neck";

export type DiagramGuide = {
  key: GuideKey;
  /** Measurement line: [x1, y1, x2, y2] in the diagram's viewBox. */
  line: [number, number, number, number];
  /** Where to place the letter chip. */
  at: [number, number];
};

export type GarmentDiagram = {
  id: string;
  name: string;
  viewBox: string;
  outline: ReactNode;
  guides: DiagramGuide[];
  /** Sensible default measurement columns for this garment (with units). */
  recommendedColumns: string[];
};

// Order matters: more specific cues first (e.g. "sleeve" / "foot" before the
// generic "length", so "Sleeve Length" / "Foot Length" resolve correctly).
const MATCHERS: { key: GuideKey; re: RegExp }[] = [
  { key: "shoulder", re: /shoulder/i },
  { key: "sleeve", re: /sleeve|arm/i },
  { key: "foot", re: /foot|sole|toe/i },
  { key: "neck", re: /neck|collar/i },
  { key: "chest", re: /chest|bust/i },
  { key: "waist", re: /waist/i },
  { key: "hip", re: /hip|seat/i },
  { key: "inseam", re: /inseam|inside\s*leg/i },
  { key: "height", re: /height/i },
  { key: "width", re: /width/i },
  { key: "length", re: /length/i },
];

export function guideKeyForLabel(label: string): GuideKey | null {
  for (const m of MATCHERS) if (m.re.test(label)) return m.key;
  return null;
}

const outlineClass = "fill-primary-soft/30 stroke-muted-foreground/50";

const TOP: GarmentDiagram = {
  id: "top",
  name: "Top",
  viewBox: "-16 -12 232 236",
  outline: (
    <path
      className={outlineClass}
      strokeWidth={2}
      strokeLinejoin="round"
      d="M72 46 C84 56 116 56 128 46 L150 38 L174 66 L156 84 L150 78 L150 184 Q150 190 144 190 L56 190 Q50 190 50 184 L50 78 L44 84 L26 66 L50 38 Z"
    />
  ),
  guides: [
    { key: "shoulder", line: [60, 52, 140, 52], at: [72, 38] },
    { key: "neck", line: [84, 49, 116, 49], at: [128, 38] },
    { key: "chest", line: [50, 92, 150, 92], at: [165, 92] },
    { key: "sleeve", line: [52, 56, 32, 80], at: [26, 92] },
    { key: "length", line: [165, 56, 165, 190], at: [180, 124] },
    { key: "width", line: [50, 184, 150, 184], at: [100, 202] },
  ],
  recommendedColumns: ["Chest (cm)", "Length (cm)", "Sleeve (cm)", "Shoulder (cm)"],
};

const BOTTOM: GarmentDiagram = {
  id: "bottom",
  name: "Bottoms",
  viewBox: "-16 -12 232 236",
  outline: (
    <path
      className={outlineClass}
      strokeWidth={2}
      strokeLinejoin="round"
      d="M54 46 L146 46 L142 186 L110 186 L100 104 L90 186 L58 186 Z"
    />
  ),
  guides: [
    { key: "waist", line: [54, 51, 146, 51], at: [100, 40] },
    { key: "hip", line: [52, 78, 148, 78], at: [163, 78] },
    { key: "inseam", line: [100, 108, 96, 184], at: [114, 150] },
    { key: "length", line: [44, 48, 44, 184], at: [33, 116] },
    { key: "width", line: [58, 192, 142, 192], at: [100, 202] },
  ],
  recommendedColumns: ["Waist (cm)", "Hip (cm)", "Inseam (cm)", "Length (cm)"],
};

const DRESS: GarmentDiagram = {
  id: "dress",
  name: "Dress",
  viewBox: "-16 -12 232 236",
  outline: (
    <path
      className={outlineClass}
      strokeWidth={2}
      strokeLinejoin="round"
      d="M72 44 C84 54 116 54 128 44 L150 36 L170 60 L154 76 L150 70 L150 98 L178 192 L22 192 L50 98 L50 70 L46 76 L30 60 L50 36 Z"
    />
  ),
  guides: [
    { key: "shoulder", line: [60, 50, 140, 50], at: [100, 38] },
    { key: "chest", line: [50, 86, 150, 86], at: [165, 86] },
    { key: "waist", line: [50, 100, 150, 100], at: [165, 104] },
    { key: "sleeve", line: [52, 54, 33, 76], at: [27, 88] },
    { key: "length", line: [182, 54, 182, 192], at: [191, 124] },
  ],
  recommendedColumns: ["Chest (cm)", "Waist (cm)", "Length (cm)", "Sleeve (cm)"],
};

const ONESIE: GarmentDiagram = {
  id: "onesie",
  name: "Bodysuit",
  viewBox: "-16 -12 232 236",
  outline: (
    <path
      className={outlineClass}
      strokeWidth={2}
      strokeLinejoin="round"
      d="M72 46 C84 56 116 56 128 46 L150 40 L168 64 L152 80 L146 74 L146 150 C146 162 138 170 126 170 L116 170 L116 158 L84 158 L84 170 L74 170 C62 170 54 162 54 150 L54 74 L48 80 L32 64 L50 40 Z"
    />
  ),
  guides: [
    { key: "shoulder", line: [60, 52, 140, 52], at: [100, 40] },
    { key: "chest", line: [54, 90, 146, 90], at: [161, 90] },
    { key: "sleeve", line: [54, 56, 34, 78], at: [28, 90] },
    { key: "length", line: [170, 56, 170, 166], at: [185, 112] },
  ],
  recommendedColumns: ["Chest (cm)", "Length (cm)", "Sleeve (cm)"],
};

const FOOTWEAR: GarmentDiagram = {
  id: "footwear",
  name: "Footwear",
  viewBox: "-16 -12 232 236",
  outline: <ellipse className={outlineClass} strokeWidth={2} cx="100" cy="105" rx="44" ry="74" />,
  guides: [
    { key: "foot", line: [100, 33, 100, 177], at: [114, 105] },
    { key: "length", line: [100, 33, 100, 177], at: [114, 105] },
    { key: "width", line: [56, 105, 144, 105], at: [100, 192] },
  ],
  recommendedColumns: ["Foot Length (cm)", "Width (cm)", "EU"],
};

const GENERIC: GarmentDiagram = {
  id: "generic",
  name: "Garment",
  viewBox: "-16 -12 232 236",
  outline: (
    <rect className={outlineClass} strokeWidth={2} x="52" y="48" width="96" height="124" rx="12" />
  ),
  guides: [
    { key: "width", line: [52, 42, 148, 42], at: [100, 32] },
    { key: "chest", line: [52, 90, 148, 90], at: [163, 90] },
    { key: "waist", line: [52, 120, 148, 120], at: [163, 120] },
    { key: "length", line: [160, 48, 160, 172], at: [175, 110] },
    { key: "height", line: [160, 48, 160, 172], at: [175, 110] },
  ],
  recommendedColumns: ["Chest (cm)", "Length (cm)", "Width (cm)"],
};

const ALL = { TOP, BOTTOM, DRESS, ONESIE, FOOTWEAR, GENERIC };

/** Choose the best diagram from the product category, falling back to column cues. */
export function pickDiagram(category: string, columnLabels: string[]): GarmentDiagram {
  const c = (category || "").toLowerCase();
  const cols = columnLabels.join(" ").toLowerCase();

  if (/boot|shoe|sandal|footwear|sock|slipper|sneaker/.test(c) || /foot|sole/.test(cols))
    return FOOTWEAR;
  if (/frock|dress|gown|skirt|tutu|pinafore/.test(c)) return DRESS;
  if (
    /onesie|bodysuit|romper|sleepsuit|sleep\s*suit|sleepwear|babygrow|jumpsuit|nightwear|pyjama|pajama/.test(
      c,
    )
  )
    return ONESIE;
  if (/short|pant|trouser|chino|legging|jogger|jean|bottom|cargo|dungaree|overall/.test(c))
    return BOTTOM;
  if (
    /polo|tee|t-?shirt|shirt|top|sweater|knit|jumper|hoodie|blouse|cardigan|two\s*piece|co-?ord|lounge|set|vest|sweatshirt/.test(
      c,
    )
  )
    return TOP;

  // Infer from the measurement columns present.
  const hasWaist = /waist/.test(cols);
  const hasInseam = /inseam/.test(cols);
  const hasChest = /chest|bust/.test(cols);
  const hasSleeve = /sleeve/.test(cols);
  if (hasWaist && hasInseam && !hasChest) return BOTTOM;
  if (hasChest || hasSleeve) return TOP;
  if (/foot|sole/.test(cols)) return FOOTWEAR;
  return GENERIC;
}

function GuideLine({
  guide,
  letter,
  active,
  onHover,
}: {
  guide: DiagramGuide;
  letter: string;
  active: boolean;
  onHover: (key: GuideKey | null) => void;
}) {
  const [x1, y1, x2, y2] = guide.line;
  const [lx, ly] = guide.at;
  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => onHover(guide.key)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onHover(guide.key)}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeLinecap="round"
        strokeWidth={active ? 3 : 1.5}
        className={active ? "stroke-primary" : "stroke-foreground/35"}
      />
      <circle cx={x1} cy={y1} r={2.4} className={active ? "fill-primary" : "fill-foreground/35"} />
      <circle cx={x2} cy={y2} r={2.4} className={active ? "fill-primary" : "fill-foreground/35"} />
      <circle
        cx={lx}
        cy={ly}
        r={9.5}
        strokeWidth={1.5}
        className={active ? "fill-primary stroke-primary" : "fill-card stroke-foreground/30"}
      />
      <text
        x={lx}
        y={ly}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
        className={active ? "fill-primary-foreground" : "fill-foreground"}
      >
        {letter}
      </text>
    </g>
  );
}

/** Renders a garment diagram, drawing only the guides that have a letter. */
export function GarmentDiagramView({
  diagram,
  letters,
  activeKey,
  onHover,
  className,
}: {
  diagram: GarmentDiagram;
  letters: Partial<Record<GuideKey, string>>;
  activeKey: GuideKey | null;
  onHover: (key: GuideKey | null) => void;
  className?: string;
}) {
  return (
    <svg
      viewBox={diagram.viewBox}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={`${diagram.name} measurement guide`}
    >
      {diagram.outline}
      {diagram.guides
        .filter((g) => letters[g.key])
        .map((g) => (
          <GuideLine
            key={g.key}
            guide={g}
            letter={letters[g.key]!}
            active={activeKey === g.key}
            onHover={onHover}
          />
        ))}
    </svg>
  );
}

export const SIZE_CHART_DIAGRAMS = ALL;
