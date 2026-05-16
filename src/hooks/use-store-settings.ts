import { useState, useEffect, useCallback } from "react";
import { storeSettingsService, type StoreSettings } from "@/lib/store-settings";

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    console.log("🚀 useStoreSettings.fetchSettings() called");
    try {
      setLoading(true);
      // Clear cache to force fresh data
      storeSettingsService.clearCache();
      console.log("🧹 Cache cleared, fetching fresh data...");
      const data = await storeSettingsService.getSettings();
      console.log("📥 Fresh settings received in hook:", data);
      setSettings(data);
      setError(null);
      console.log("✅ Settings state updated successfully");
    } catch (err) {
      setError("Failed to load store settings");
      console.error("❌ Error loading settings in hook:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(
    async (key: keyof StoreSettings, value: string) => {
      const result = await storeSettingsService.updateSetting(key, value);
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
  };
}
