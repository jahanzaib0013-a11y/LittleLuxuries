import { supabase } from "./supabase";

export interface ShippingZone {
  id?: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  icon: "globe" | "plane";
  shipping_cost: number;
  free_shipping_threshold?: number | null;
  delivery_info: string;
  countries: string[];
}

class ShippingZonesService {
  private cache: ShippingZone[] = [];
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  async getZones(): Promise<ShippingZone[]> {
    // Return cached if valid
    if (this.cache.length > 0 && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const { data, error } = await supabase.from("shipping_zones").select("*").order("name");

      if (error) {
        console.error("Error fetching shipping zones:", error);
        return this.getDefaultZones();
      }

      // Transform data to match our interface and add zone_id mapping
      const zones = (data || []).map((zone: any) => ({
        id: this.getZoneIdByName(zone.name),
        name: zone.name,
        description: zone.description || "",
        status: zone.status as "ACTIVE" | "INACTIVE",
        icon: zone.icon as "globe" | "plane",
        shipping_cost: Number(zone.shipping_cost) || 0,
        free_shipping_threshold: zone.free_shipping_threshold
          ? Number(zone.free_shipping_threshold)
          : null,
        delivery_info: zone.delivery_info || "",
        countries: zone.countries || [],
      }));

      this.cache = zones;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      return zones;
    } catch (err) {
      console.error("Failed to fetch shipping zones:", err);
      return this.getDefaultZones();
    }
  }

  private getZoneIdByName(name: string): string {
    const zoneMap: Record<string, string> = {
      Pakistan: "pakistan",
      "United Arab Emirates": "uae",
      Thailand: "thailand",
      "United Kingdom": "uk",
      "United States": "usa",
      "Domestic (UK)": "domestic_uk",
      "European Union": "eu",
    };
    return zoneMap[name] || name.toLowerCase().replace(/\s+/g, "_");
  }

  async updateZone(
    id: string,
    updates: Partial<ShippingZone>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find zone by name to get the actual database record
      const zone = this.cache.find((z) => z.id === id);
      if (!zone) {
        return { success: false, error: "Zone not found" };
      }

      const { data, error } = await supabase
        .from("shipping_zones")
        .update(updates)
        .eq("name", zone.name)
        .select()
        .single();

      if (error) {
        console.error("Error updating shipping zone:", error);
        return { success: false, error: error.message };
      }

      // Update cache
      const index = this.cache.findIndex((zone) => zone.id === id);
      if (index !== -1) {
        this.cache[index] = { ...this.cache[index], ...updates };
      }

      console.log("Shipping zone updated successfully:", { id, updates });
      return { success: true };
    } catch (err) {
      console.error("Failed to update shipping zone:", err);
      return { success: false, error: "Failed to update shipping zone" };
    }
  }

  async updateMultipleZones(zones: ShippingZone[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = zones.map((zone) => ({
        name: zone.name,
        description: zone.description,
        status: zone.status,
        icon: zone.icon,
        shipping_cost: zone.shipping_cost,
        free_shipping_threshold: zone.free_shipping_threshold,
        delivery_info: zone.delivery_info,
        countries: zone.countries,
      }));

      const { data, error } = await supabase
        .from("shipping_zones")
        .upsert(updates, { onConflict: "name" })
        .select();

      if (error) {
        console.error("Error updating multiple shipping zones:", error);
        return { success: false, error: error.message };
      }

      // Update cache
      this.cache = zones;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      console.log("Multiple shipping zones updated successfully:", zones.length);
      return { success: true };
    } catch (err) {
      console.error("Failed to update multiple shipping zones:", err);
      return { success: false, error: "Failed to update shipping zones" };
    }
  }

  calculateShipping(orderSubtotal: number, zoneId: string): number {
    const zone = this.cache.find((z) => z.id === zoneId);
    if (!zone) {
      return zoneId === "pakistan"
        ? orderSubtotal >= 10_000
          ? 0
          : 250
        : 0;
    }

    const isDomesticPk = zoneId === "pakistan";
    if (!isDomesticPk && zone.status !== "ACTIVE") {
      return 0;
    }

    if (
      zone.free_shipping_threshold != null &&
      orderSubtotal >= zone.free_shipping_threshold
    ) {
      return 0;
    }

    return zone.shipping_cost;
  }

  clearCache(): void {
    this.cache = [];
    this.cacheExpiry = 0;
  }

  private getDefaultZones(): ShippingZone[] {
    return [
      {
        id: "pakistan",
        name: "Pakistan",
        description: "Domestic shipping across all major cities and regions",
        status: "INACTIVE",
        icon: "globe",
        shipping_cost: 250,
        free_shipping_threshold: 10_000,
        delivery_info: "Flat PKR 250 · Free from PKR 10,000",
        countries: ["Pakistan"],
      },
      {
        id: "uae",
        name: "United Arab Emirates",
        description: "Express delivery to UAE major cities (Dubai, Abu Dhabi, Sharjah)",
        status: "INACTIVE",
        icon: "plane",
        shipping_cost: 4500,
        free_shipping_threshold: null,
        delivery_info: "Flat Rate PKR 4,500",
        countries: ["United Arab Emirates"],
      },
      {
        id: "thailand",
        name: "Thailand",
        description: "Standard delivery to Bangkok and major Thai cities",
        status: "INACTIVE",
        icon: "plane",
        shipping_cost: 5500,
        free_shipping_threshold: null,
        delivery_info: "Flat Rate PKR 5,500",
        countries: ["Thailand"],
      },
      {
        id: "uk",
        name: "United Kingdom",
        description: "Standard tracked shipping across United Kingdom",
        status: "ACTIVE",
        icon: "plane",
        shipping_cost: 7000,
        free_shipping_threshold: null,
        delivery_info: "Flat Rate PKR 7,000",
        countries: ["United Kingdom"],
      },
      {
        id: "usa",
        name: "United States",
        description: "Express delivery to all US states and territories",
        status: "INACTIVE",
        icon: "plane",
        shipping_cost: 8000,
        free_shipping_threshold: null,
        delivery_info: "Flat Rate PKR 8,000",
        countries: ["United States"],
      },
    ];
  }
}

export const shippingZonesService = new ShippingZonesService();
