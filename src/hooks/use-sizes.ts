import { useDbList } from "@/hooks/use-db-list";

export type SizeDef = { id: string; name: string };

const defaultSizes: SizeDef[] = [
  { id: "s1", name: "Newborn" },
  { id: "s2", name: "0–3M" },
  { id: "s3", name: "3–6M" },
  { id: "s4", name: "6–12M" },
  { id: "s5", name: "12–18M" },
  { id: "s6", name: "18–24M" },
  { id: "s7", name: "One Size" },
];

/** Global size list — persisted in Supabase (`site_lists` id="sizes"). */
export function useSizes() {
  const { items: sizes, setItems: setSizes } = useDbList<SizeDef>(
    "sizes",
    defaultSizes,
    "sizes-updated",
    "site_sizes",
  );
  return { sizes, setSizes, defaultSizes };
}
