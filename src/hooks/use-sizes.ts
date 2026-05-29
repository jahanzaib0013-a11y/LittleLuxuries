import { useEffect, useState } from "react";

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

export function useSizes() {
  const [sizes, setSizesState] = useState<SizeDef[]>(defaultSizes);

  useEffect(() => {
    const saved = localStorage.getItem("site_sizes");
    if (saved) {
      try {
        setSizesState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse sizes", e);
      }
    }

    const handleStorageChange = () => {
      const updated = localStorage.getItem("site_sizes");
      if (!updated) return;
      try {
        setSizesState(JSON.parse(updated));
      } catch (e) {
        console.error("Failed to parse size update", e);
      }
    };

    window.addEventListener("sizes-updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("sizes-updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setSizes = (newSizes: SizeDef[] | ((prev: SizeDef[]) => SizeDef[])) => {
    setSizesState((prev) => {
      const updated = typeof newSizes === "function" ? newSizes(prev) : newSizes;
      localStorage.setItem("site_sizes", JSON.stringify(updated));
      window.dispatchEvent(new Event("sizes-updated"));
      return updated;
    });
  };

  return { sizes, setSizes, defaultSizes };
}
