import { supabase } from "./supabase";

export interface AdminSettings {
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  admin_role: string;
  admin_permissions: string;
  admin_two_factor_enabled: boolean;
  admin_last_login: string;
  admin_account_created: string;
}

class AdminSettingsService {
  private cache: Partial<AdminSettings> = {};
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  async getSettings(): Promise<AdminSettings> {
    // Return cached if valid
    if (Object.keys(this.cache).length > 0 && Date.now() < this.cacheExpiry) {
      return this.cache as AdminSettings;
    }

    try {
      const { data, error } = await supabase.from("admin_settings").select("key, value");

      if (error) {
        console.error("Error fetching admin settings:", error);
        return this.getDefaultSettings();
      }

      // Convert array to object
      const settings: Partial<AdminSettings> = {};
      data?.forEach((row: { key: string; value: string }) => {
        const key = row.key as keyof AdminSettings;
        if (key === "admin_two_factor_enabled") {
          (settings as Record<string, any>)[key] = row.value === "true";
        } else {
          (settings as Record<string, any>)[key] = row.value;
        }
      });

      this.cache = settings;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      return { ...this.getDefaultSettings(), ...settings } as AdminSettings;
    } catch (err) {
      console.error("Failed to fetch admin settings:", err);
      return this.getDefaultSettings();
    }
  }

  async updateSetting(
    key: keyof AdminSettings,
    value: string | boolean,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const stringValue = typeof value === "boolean" ? value.toString() : value;

      const { data, error } = await supabase
        .from("admin_settings")
        .upsert(
          {
            key,
            value: stringValue,
          },
          { onConflict: "key" },
        )
        .select()
        .single();

      if (error) {
        console.error("Error updating admin setting:", error);
        return { success: false, error: error.message };
      }

      // Update cache
      (this.cache as Record<string, any>)[key] = value;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      console.log("Admin setting updated successfully:", { key, value });
      return { success: true };
    } catch (err) {
      console.error("Failed to update admin setting:", err);
      return { success: false, error: "Failed to update setting" };
    }
  }

  async updateMultipleSettings(
    settings: Partial<AdminSettings>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === "boolean" ? value.toString() : value,
      }));

      const { data, error } = await supabase
        .from("admin_settings")
        .upsert(updates, { onConflict: "key" })
        .select();

      if (error) {
        console.error("Error updating multiple admin settings:", error);
        return { success: false, error: error.message };
      }

      // Update cache
      Object.assign(this.cache, settings);
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      console.log("Multiple admin settings updated successfully:", settings);
      return { success: true };
    } catch (err) {
      console.error("Failed to update multiple admin settings:", err);
      return { success: false, error: "Failed to update settings" };
    }
  }

  clearCache(): void {
    this.cache = {};
    this.cacheExpiry = 0;
  }

  private getDefaultSettings(): AdminSettings {
    return {
      admin_name: "Eleanor Vance",
      admin_email: "eleanor.vance@littleluxuries.com",
      admin_phone: "+44 20 7123 4567",
      admin_role: "Senior Store Manager",
      admin_permissions: "Full Permissions",
      admin_two_factor_enabled: false,
      admin_last_login: new Date().toLocaleDateString(),
      admin_account_created: "2023-01-15",
    };
  }
}

export const adminSettingsService = new AdminSettingsService();
