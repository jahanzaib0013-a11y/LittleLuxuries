import { useEffect, useState } from "react";
import {
  BUILTIN_SIZE_CHART_TEMPLATES,
  type SizeChart,
  type SizeChartTemplate,
} from "@/lib/size-chart";

const STORAGE_KEY = "size_chart_templates";
const UPDATED_EVENT = "size-chart-templates-updated";

function loadCustom(): SizeChartTemplate[] {
  if (typeof localStorage === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse size chart templates", e);
    return [];
  }
}

function persist(custom: SizeChartTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

/**
 * Reusable size-chart templates: the built-in starting points plus any the
 * admin saves. Saved templates live in localStorage and sync across open
 * forms (mirrors the pattern used by `useSizes`).
 */
export function useSizeChartTemplates() {
  const [custom, setCustom] = useState<SizeChartTemplate[]>([]);

  useEffect(() => {
    setCustom(loadCustom());
    const handleChange = () => setCustom(loadCustom());
    window.addEventListener(UPDATED_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(UPDATED_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const saveTemplate = (name: string, chart: SizeChart): SizeChartTemplate => {
    const template: SizeChartTemplate = {
      id: `tpl-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim() || "Untitled chart",
      chart: {
        columns: chart.columns,
        rows: chart.rows,
        baseUnit: chart.baseUnit,
        allowUnitToggle: chart.allowUnitToggle,
        howToMeasure: chart.howToMeasure,
        measureImageUrl: chart.measureImageUrl,
      },
    };
    const next = [...loadCustom(), template];
    persist(next);
    setCustom(next);
    return template;
  };

  const removeTemplate = (id: string) => {
    const next = loadCustom().filter((t) => t.id !== id);
    persist(next);
    setCustom(next);
  };

  return {
    builtinTemplates: BUILTIN_SIZE_CHART_TEMPLATES,
    customTemplates: custom,
    templates: [...BUILTIN_SIZE_CHART_TEMPLATES, ...custom],
    saveTemplate,
    removeTemplate,
  };
}
