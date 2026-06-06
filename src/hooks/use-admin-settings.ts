import { useState, useEffect, useCallback } from "react";
import { adminSettingsService, AdminSettings } from "@/lib/admin-settings";

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminSettingsService.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError("Failed to load admin settings");
      console.error("Error loading admin settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(
    async (key: keyof AdminSettings, value: string | boolean) => {
      const result = await adminSettingsService.updateSetting(key, value);
      if (result.success) {
        await fetchSettings();
      }
      return result;
    },
    [fetchSettings],
  );

  const updateMultipleSettings = useCallback(
    async (newSettings: Partial<AdminSettings>) => {
      const result = await adminSettingsService.updateMultipleSettings(newSettings);
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
  };
}
