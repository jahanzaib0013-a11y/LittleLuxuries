import { useEffect, useMemo, useState } from "react";
import {
  computeOrderTotals,
  loadCheckoutPricingInputs,
} from "@/lib/checkout-pricing";
import type { ShippingZone } from "@/lib/shipping-zones";
import type { TaxSetting } from "@/lib/tax-settings";

export function useCheckoutPricing(params: {
  subtotal: number;
  discount?: number;
  countryCode?: string;
}) {
  const [taxSettings, setTaxSettings] = useState<Record<string, TaxSetting>>({});
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCheckoutPricingInputs().then((inputs) => {
      if (cancelled) return;
      setTaxSettings(inputs.taxSettings);
      setShippingZones(inputs.shippingZones);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    if (!ready) {
      const taxableAmount = Math.max(0, params.subtotal - (params.discount ?? 0));
      return {
        subtotal: params.subtotal,
        discount: params.discount ?? 0,
        taxableAmount,
        tax: 0,
        taxLabel: null as string | null,
        shipping: 0,
        total: taxableAmount,
      };
    }
    return computeOrderTotals(
      { taxSettings, shippingZones },
      {
        subtotal: params.subtotal,
        discount: params.discount,
        countryCode: params.countryCode,
      },
    );
  }, [
    ready,
    taxSettings,
    shippingZones,
    params.subtotal,
    params.discount,
    params.countryCode,
  ]);

  return { ...totals, ready };
}
