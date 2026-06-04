import { supabase } from "./supabase";

export interface StoreSettings {
  store_name: string;
  business_email: string;
  contact_phone: string;
  timezone: string;
  timezone_display: string;
  logo_url: string;
  currency: string;
  currency_symbol: string;
  address_line1: string;
  address_city: string;
  address_country: string;
  business_hours: string;
  business_hours_start: string;
  business_hours_end: string;
  social_instagram: string;
  social_facebook: string;
  meta_title_suffix: string;
  meta_description: string;
}

export const defaultStoreSettings: StoreSettings = {
  store_name: "Little Luxuries",
  business_email: "concierge@littleluxuries.com",
  contact_phone: "+1 (555) 892-0192",
  timezone: "Europe/London",
  timezone_display: "London (GMT +00)",
  logo_url: "/src/assets/logo.png",
  currency: "PKR",
  currency_symbol: "₨",
  address_line1: "123 Nursery Lane",
  address_city: "London",
  address_country: "United Kingdom",
  business_hours: "Mon–Fri · 9am – 5pm GMT",
  business_hours_start: "09:00",
  business_hours_end: "17:00",
  social_instagram: "@littleluxuries",
  social_facebook: "littleluxuries",
  meta_title_suffix: "Little Luxuries",
  meta_description: "Premium baby garments crafted with love and organic materials.",
};

const CACHE_TTL_MS = 5 * 60 * 1000;

class StoreSettingsService {
  private cache: Partial<StoreSettings> = {};
  private cacheExpiry = 0;

  async getSettings(): Promise<StoreSettings> {
    if (Object.keys(this.cache).length > 0 && Date.now() < this.cacheExpiry) {
      return { ...defaultStoreSettings, ...this.cache };
    }

    try {
      const { data, error } = await supabase.from("store_settings").select("key, value");

      if (error) {
        console.error("Error fetching store settings:", error);
        return defaultStoreSettings;
      }

      const settings: Partial<StoreSettings> = {};
      data?.forEach((row: { key: string; value: string }) => {
        const key = row.key as keyof StoreSettings;
        (settings as Record<string, string>)[key] = row.value;
      });

      this.cache = settings;
      this.cacheExpiry = Date.now() + CACHE_TTL_MS;

      return { ...defaultStoreSettings, ...settings };
    } catch (err) {
      console.error("Failed to fetch store settings:", err);
      return defaultStoreSettings;
    }
  }

  async getSetting<K extends keyof StoreSettings>(key: K): Promise<StoreSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  async updateSetting(
    key: keyof StoreSettings,
    value: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("store_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

      if (error) {
        console.error("Error updating setting:", error);
        return { success: false, error: error.message };
      }

      this.cache = {};
      this.cacheExpiry = 0;

      return { success: true };
    } catch (err) {
      console.error("Failed to update setting:", err);
      return { success: false, error: "Failed to update setting" };
    }
  }

  clearCache(): void {
    this.cache = {};
    this.cacheExpiry = 0;
  }

  formatPrice(amount: number, settings?: StoreSettings): string {
    const symbol = settings?.currency_symbol || defaultStoreSettings.currency_symbol;
    return `${symbol}${amount.toFixed(2)}`;
  }

  getPageTitle(pageTitle: string, settings?: StoreSettings): string {
    const suffix = settings?.meta_title_suffix || defaultStoreSettings.meta_title_suffix;
    return `${pageTitle} — ${suffix}`;
  }
}

export const storeSettingsService = new StoreSettingsService();
