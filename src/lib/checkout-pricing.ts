import { shippingZonesService, type ShippingZone } from "@/lib/shipping-zones";
import { taxSettingsService, type TaxSetting } from "@/lib/tax-settings";

const COUNTRY_TO_ZONE: Record<string, string> = {
  PK: "pakistan",
  AE: "uae",
  TH: "thailand",
  GB: "uk",
  US: "usa",
};

/** Pakistan domestic defaults when DB is unavailable */
export const PAKISTAN_SHIPPING_FLAT = 250;
export const PAKISTAN_FREE_SHIPPING_THRESHOLD = 10_000;

export function countryToZoneId(countryCode: string): string {
  return COUNTRY_TO_ZONE[countryCode.toUpperCase()] ?? "pakistan";
}

export function computeShipping(
  zones: ShippingZone[],
  orderSubtotal: number,
  countryCode = "PK",
): number {
  const zoneId = countryToZoneId(countryCode);
  const zone = zones.find((z) => z.id === zoneId);

  if (!zone) {
    return countryCode.toUpperCase() === "PK"
      ? orderSubtotal >= PAKISTAN_FREE_SHIPPING_THRESHOLD
        ? 0
        : PAKISTAN_SHIPPING_FLAT
      : 0;
  }

  // Storefront checkout is Pakistan-only: always use domestic rates for PK
  const isDomesticPk = zoneId === "pakistan" && countryCode.toUpperCase() === "PK";
  if (!isDomesticPk && zone.status !== "ACTIVE") {
    return 0;
  }

  const flatRate = isDomesticPk
    ? zone.shipping_cost > 0
      ? zone.shipping_cost
      : PAKISTAN_SHIPPING_FLAT
    : zone.shipping_cost;
  const freeThreshold = isDomesticPk
    ? (zone.free_shipping_threshold ?? PAKISTAN_FREE_SHIPPING_THRESHOLD)
    : zone.free_shipping_threshold;

  if (freeThreshold != null && orderSubtotal >= freeThreshold) {
    return 0;
  }

  return flatRate;
}

export function computeTax(
  taxSettings: Record<string, TaxSetting>,
  taxableAmount: number,
  countryCode = "PK",
): { taxAmount: number; label: string | null } {
  const zoneId = countryToZoneId(countryCode);
  const setting = taxSettings[zoneId];

  if (!setting || setting.status !== "ACTIVE" || setting.tax_rate <= 0) {
    return { taxAmount: 0, label: null };
  }

  const taxAmount = setting.tax_inclusive
    ? (taxableAmount * setting.tax_rate) / (100 + setting.tax_rate)
    : (taxableAmount * setting.tax_rate) / 100;
  const rounded = Number(taxAmount.toFixed(2));
  const label = `${setting.tax_type} (${setting.tax_rate}%)`;

  return { taxAmount: rounded, label };
}

export async function loadCheckoutPricingInputs(): Promise<{
  taxSettings: Record<string, TaxSetting>;
  shippingZones: ShippingZone[];
}> {
  const [taxSettings, shippingZones] = await Promise.all([
    taxSettingsService.getTaxSettings(),
    shippingZonesService.getZones(),
  ]);
  return { taxSettings, shippingZones };
}

export function computeOrderTotals(
  inputs: {
    taxSettings: Record<string, TaxSetting>;
    shippingZones: ShippingZone[];
  },
  params: {
    subtotal: number;
    discount?: number;
    countryCode?: string;
  },
): {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  taxLabel: string | null;
  shipping: number;
  total: number;
} {
  const discount = params.discount ?? 0;
  const taxableAmount = Math.max(0, params.subtotal - discount);
  const countryCode = params.countryCode ?? "PK";

  const { taxAmount, label } = computeTax(inputs.taxSettings, taxableAmount, countryCode);
  const shipping = computeShipping(inputs.shippingZones, taxableAmount, countryCode);
  const total = taxableAmount + taxAmount + shipping;

  return {
    subtotal: params.subtotal,
    discount,
    taxableAmount,
    tax: taxAmount,
    taxLabel: label,
    shipping,
    total,
  };
}
