import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  storeSettingsService,
  defaultStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings";
import { FIVE_MINUTES } from "@/lib/query-client";

export const storeSettingsKeys = {
  all: ["store-settings"] as const,
};

export function useStoreSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: storeSettingsKeys.all,
    queryFn: () => storeSettingsService.getSettings(),
    staleTime: FIVE_MINUTES,
  });

  const updateSetting = useCallback(
    async (key: keyof StoreSettings, value: string) => {
      const result = await storeSettingsService.updateSetting(key, value);
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: storeSettingsKeys.all });
      }
      return result;
    },
    [queryClient],
  );

  return {
    settings: data ?? null,
    loading: isLoading && !data,
    error: error ? "Failed to load store settings" : null,
    refresh: async () => {
      await refetch();
    },
    updateSetting,
  };
}
