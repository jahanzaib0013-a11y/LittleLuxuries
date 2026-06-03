import { useState, useEffect, useCallback } from "react";
import { shippingZonesService, ShippingZone } from "@/lib/shipping-zones";

export function useShippingZones() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shippingZonesService.getZones();
      setZones(data);
      setError(null);
    } catch (err) {
      setError("Failed to load shipping zones");
      console.error("Error loading shipping zones:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const updateZone = useCallback(
    async (id: string, updates: Partial<ShippingZone>) => {
      const result = await shippingZonesService.updateZone(id, updates);
      if (result.success) {
        await fetchZones();
      }
      return result;
    },
    [fetchZones],
  );

  const updateMultipleZones = useCallback(
    async (updatedZones: ShippingZone[]) => {
      const result = await shippingZonesService.updateMultipleZones(updatedZones);
      if (result.success) {
        await fetchZones();
      }
      return result;
    },
    [fetchZones],
  );

  const toggleZoneStatus = useCallback(
    async (id: string) => {
      const zone = zones.find((z) => z.id === id);
      if (!zone) return { success: false, error: "Zone not found" };

      const newStatus = zone.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      return await updateZone(id, { status: newStatus });
    },
    [zones, updateZone],
  );

  return {
    zones,
    loading,
    error,
    refresh: fetchZones,
    updateZone,
    updateMultipleZones,
    toggleZoneStatus,
  };
}
