import { createContext, useContext, ReactNode } from "react";
import { useStoreSettings } from "@/hooks/use-store-settings";
import type { StoreSettings } from "@/lib/store-settings";

interface StoreSettingsContextType {
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSetting: (
    key: keyof StoreSettings,
    value: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const storeSettings = useStoreSettings();

  return (
    <StoreSettingsContext.Provider value={storeSettings}>{children}</StoreSettingsContext.Provider>
  );
}

export function useStoreSettingsContext() {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error("useStoreSettingsContext must be used within a StoreSettingsProvider");
  }
  return context;
}
