import { supabase } from "./supabase";

export interface TaxSetting {
  country_code: string;
  zone_id: string;
  tax_rate: number;
  tax_type: "GST" | "VAT" | "Sales Tax" | "Custom Duty";
  tax_inclusive: boolean;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

class TaxSettingsService {
  private cache: Record<string, TaxSetting> = {};
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  async getTaxSettings(): Promise<Record<string, TaxSetting>> {
    // Return cached if valid
    if (Object.keys(this.cache).length > 0 && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const { data, error } = await supabase.from("tax_settings").select("*");

      if (error) {
        console.error("Error fetching tax settings:", error);
        return this.getDefaultTaxSettings();
      }

      // Convert array to object keyed by zone_id
      const settings: Record<string, TaxSetting> = {};
      data?.forEach((row: any) => {
        if (row.zone_id) {
          settings[row.zone_id] = {
            country_code: row.country_code,
            zone_id: row.zone_id,
            tax_rate: Number(row.tax_rate) || 0,
            tax_type: row.tax_type as TaxSetting["tax_type"],
            tax_inclusive: Boolean(row.tax_inclusive),
            description: row.description || "",
            status: (row.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
          };
        }
      });

      this.cache = settings;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      return settings;
    } catch (err) {
      console.error("Failed to fetch tax settings:", err);
      return this.getDefaultTaxSettings();
    }
  }

  async updateTaxSetting(
    zoneId: string,
    updates: Partial<TaxSetting>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentSetting = this.cache[zoneId];
      if (!currentSetting) {
        return { success: false, error: "Tax setting not found" };
      }

      const { data, error } = await supabase
        .from("tax_settings")
        .update({
          tax_rate: updates.tax_rate,
          tax_type: updates.tax_type,
          tax_inclusive: updates.tax_inclusive,
          description: updates.description,
        })
        .eq("zone_id", zoneId)
        .select()
        .single();

      if (error) {
        console.error("Error updating tax setting:", error);
        return { success: false, error: error.message };
      }

      // Update cache
      this.cache[zoneId] = { ...this.cache[zoneId], ...updates };

      console.log("Tax setting updated successfully:", { zoneId, updates });
      return { success: true };
    } catch (err) {
      console.error("Failed to update tax setting:", err);
      return { success: false, error: "Failed to update tax setting" };
    }
  }

  async updateMultipleTaxSettings(
    settings: Record<string, TaxSetting>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = Object.values(settings).map((setting) => ({
        country_code: setting.country_code,
        zone_id: setting.zone_id,
        tax_rate: setting.tax_rate,
        tax_type: setting.tax_type,
        tax_inclusive: setting.tax_inclusive,
        description: setting.description,
        status: setting.status,
      }));

      const { data, error } = await supabase
        .from("tax_settings")
        .upsert(updates, { onConflict: "zone_id" })
        .select();

      if (error) {
        console.error("Error updating multiple tax settings:", error);
        return { success: false, error: error.message };
      }

      // Update cache
      this.cache = settings;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      console.log("Multiple tax settings updated successfully:", Object.keys(settings).length);
      return { success: true };
    } catch (err) {
      console.error("Failed to update multiple tax settings:", err);
      return { success: false, error: "Failed to update tax settings" };
    }
  }

  async toggleTaxStatus(zoneId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Attempting to toggle tax status for zone: ${zoneId}`);

      const currentSetting = this.cache[zoneId];
      if (!currentSetting) {
        console.error(
          `Tax setting not found for zone: ${zoneId}. Available zones:`,
          Object.keys(this.cache),
        );
        return { success: false, error: "Tax setting not found" };
      }

      const newStatus = currentSetting.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      console.log(
        `Changing status from ${currentSetting.status} to ${newStatus} for zone: ${zoneId}`,
      );

      const { data, error } = await supabase
        .from("tax_settings")
        .update({ status: newStatus })
        .eq("zone_id", zoneId)
        .select()
        .single();

      if (error) {
        console.error("Error toggling tax status:", error);
        return { success: false, error: error.message };
      }

      console.log(`Database update successful for zone: ${zoneId}`, data);

      // Update cache
      this.cache[zoneId] = { ...this.cache[zoneId], status: newStatus };

      console.log(`Tax status toggled successfully: ${zoneId} -> ${newStatus}`);
      return { success: true };
    } catch (err) {
      console.error("Failed to toggle tax status:", err);
      return { success: false, error: "Failed to toggle tax status" };
    }
  }

  calculateTax(amount: number, zoneId: string): { taxAmount: number; totalAmount: number } {
    const taxSetting = this.cache[zoneId];
    if (!taxSetting || taxSetting.status !== "ACTIVE") {
      return { taxAmount: 0, totalAmount: amount };
    }

    const taxAmount = taxSetting.tax_inclusive
      ? (amount * taxSetting.tax_rate) / (100 + taxSetting.tax_rate)
      : (amount * taxSetting.tax_rate) / 100;

    const totalAmount = taxSetting.tax_inclusive ? amount : amount + taxAmount;

    return { taxAmount, totalAmount };
  }

  clearCache(): void {
    this.cache = {};
    this.cacheExpiry = 0;
  }

  private getDefaultTaxSettings(): Record<string, TaxSetting> {
    return {
      pakistan: {
        country_code: "PK",
        zone_id: "pakistan",
        tax_rate: 18,
        tax_type: "GST",
        tax_inclusive: true,
        description: "Standard Federal Sales Tax (GST)",
        status: "ACTIVE",
      },
      uae: {
        country_code: "AE",
        zone_id: "uae",
        tax_rate: 5,
        tax_type: "VAT",
        tax_inclusive: true,
        description: "Standard Value Added Tax",
        status: "ACTIVE",
      },
      thailand: {
        country_code: "TH",
        zone_id: "thailand",
        tax_rate: 7,
        tax_type: "VAT",
        tax_inclusive: true,
        description: "Standard VAT (reduced from 10% until 2026)",
        status: "ACTIVE",
      },
      uk: {
        country_code: "GB",
        zone_id: "uk",
        tax_rate: 20,
        tax_type: "VAT",
        tax_inclusive: true,
        description: "Standard Value Added Tax",
        status: "ACTIVE",
      },
      usa: {
        country_code: "US",
        zone_id: "usa",
        tax_rate: 7.25,
        tax_type: "Sales Tax",
        tax_inclusive: false,
        description: "Average Combined State & Local Sales Tax",
        status: "INACTIVE",
      },
    };
  }
}

export const taxSettingsService = new TaxSettingsService();
