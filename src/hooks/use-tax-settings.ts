import { useState, useEffect, useCallback } from "react";
import { taxSettingsService, TaxSetting } from "@/lib/tax-settings";

export function useTaxSettings() {
  const [settings, setSettings] = useState<Record<string, TaxSetting>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await taxSettingsService.getTaxSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError("Failed to load tax settings");
      console.error("Error loading tax settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(
    async (zoneId: string, updates: Partial<TaxSetting>) => {
      const result = await taxSettingsService.updateTaxSetting(zoneId, updates);
      if (result.success) {
        await fetchSettings();
      }
      return result;
    },
    [fetchSettings],
  );

  const updateMultipleSettings = useCallback(
    async (newSettings: Record<string, TaxSetting>) => {
      const result = await taxSettingsService.updateMultipleTaxSettings(newSettings);
      if (result.success) {
        await fetchSettings();
      }
      return result;
    },
    [fetchSettings],
  );

  const calculateTax = useCallback((amount: number, zoneId: string) => {
    return taxSettingsService.calculateTax(amount, zoneId);
  }, []);

  const handleToggleTaxStatus = useCallback(
    async (zoneId: string) => {
      const result = await taxSettingsService.toggleTaxStatus(zoneId);
      if (result.success) {
        await fetchSettings();
      }
      return result;
    },
    [fetchSettings],
  );

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    updateSetting,
    updateMultipleSettings,
    calculateTax,
    toggleTaxStatus: handleToggleTaxStatus,
  };
}
