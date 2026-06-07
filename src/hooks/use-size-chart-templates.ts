import { useDbList } from "@/hooks/use-db-list";
import {
  BUILTIN_SIZE_CHART_TEMPLATES,
  type SizeChart,
  type SizeChartTemplate,
} from "@/lib/size-chart";

/**
 * Reusable size-chart templates: the built-in starting points plus any the
 * admin saves. Custom templates are persisted in Supabase (`site_lists`
 * id="size_chart_templates") with a localStorage cache, so they're shared
 * across devices and survive browser resets.
 */
export function useSizeChartTemplates() {
  const { items: custom, setItems } = useDbList<SizeChartTemplate>(
    "size_chart_templates",
    [],
    "size-chart-templates-updated",
    "size_chart_templates",
  );

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
    setItems((prev) => [...prev, template]);
    return template;
  };

  const removeTemplate = (id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    builtinTemplates: BUILTIN_SIZE_CHART_TEMPLATES,
    customTemplates: custom,
    templates: [...BUILTIN_SIZE_CHART_TEMPLATES, ...custom],
    saveTemplate,
    removeTemplate,
  };
}
