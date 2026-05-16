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

const defaultSettings: StoreSettings = {
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

class StoreSettingsService {
  private cache: Partial<StoreSettings> = {};
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 1000; // 1 second cache

  async getSettings(): Promise<StoreSettings> {
    console.log("🔍 StoreSettingsService.getSettings() called");

    // Return cached if valid
    if (Object.keys(this.cache).length > 0 && Date.now() < this.cacheExpiry) {
      console.log("📦 Returning cached settings:", this.cache);
      return { ...defaultSettings, ...this.cache };
    }

    console.log("🌐 Fetching fresh settings from database...");
    try {
      const { data, error } = await supabase.from("store_settings").select("key, value");

      if (error) {
        console.error("❌ Error fetching store settings:", error);
        return defaultSettings;
      }

      console.log("📊 Raw database data:", data);

      // Convert array to object
      const settings: Partial<StoreSettings> = {};
      data?.forEach((row: { key: string; value: string }) => {
        const key = row.key as keyof StoreSettings;
        (settings as Record<string, string>)[key] = row.value;
        console.log(`📝 Setting ${key}: ${row.value}`);
      });

      console.log("✅ Processed settings:", settings);

      this.cache = settings;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      const finalSettings = { ...defaultSettings, ...settings };
      console.log("🎯 Final settings to return:", finalSettings);

      return finalSettings;
    } catch (err) {
      console.error("❌ Failed to fetch store settings:", err);
      return defaultSettings;
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
    console.log(`💾 Updating setting ${key} to: "${value}"`);
    try {
      const { error } = await supabase
        .from("store_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

      if (error) {
        console.error("❌ Error updating setting:", error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully updated ${key} to "${value}"`);

      // Clear cache to force refresh
      this.cache = {};
      this.cacheExpiry = 0;
      console.log("🗑️ Cache cleared for refresh");

      return { success: true };
    } catch (err) {
      console.error("❌ Failed to update setting:", err);
      return { success: false, error: "Failed to update setting" };
    }
  }

  // Force clear cache for debugging
  clearCache(): void {
    this.cache = {};
    this.cacheExpiry = 0;
  }

  // Format price with currency
  formatPrice(amount: number, settings?: StoreSettings): string {
    const symbol = settings?.currency_symbol || defaultSettings.currency_symbol;
    return `${symbol}${amount.toFixed(2)}`;
  }

  // Get page title with store suffix
  getPageTitle(pageTitle: string, settings?: StoreSettings): string {
    const suffix = settings?.meta_title_suffix || defaultSettings.meta_title_suffix;
    return `${pageTitle} — ${suffix}`;
  }
}

export const storeSettingsService = new StoreSettingsService();
