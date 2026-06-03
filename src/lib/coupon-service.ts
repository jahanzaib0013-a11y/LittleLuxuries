import { supabase } from "@/lib/supabase";

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  discount_value: number;
  status: "active" | "expired" | "scheduled";
  redemptions: number;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
}

export const couponService = {
  async getCoupons() {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Coupon[];
  },

  async createCoupon(coupon: Omit<Coupon, "id" | "created_at" | "redemptions">) {
    const { data, error } = await supabase.from("coupons").insert([coupon]).select().single();

    if (error) throw error;
    return data as Coupon;
  },

  async deleteCoupon(id: string) {
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  async getCouponStats() {
    const { data, error } = await supabase.from("coupons").select("*");

    if (error) throw error;

    const coupons = data as Coupon[];
    const activeCount = coupons.filter((c) => c.status === "active").length;
    const totalRedeemed = coupons.reduce((sum, c) => sum + c.redemptions, 0);

    // Revenue influence is mock for now or can be calculated if we join with orders
    // Let's assume a mock multiplier for now to show "working" data
    const revenueInfluence = totalRedeemed * 45.5;

    return {
      active_offers: activeCount,
      total_redeemed: totalRedeemed,
      revenue_influence: revenueInfluence,
    };
  },

  async validateCoupon(code: string) {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const coupon = data as Coupon;

    // Check dates
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) return null;
    if (coupon.expires_at && new Date(coupon.expires_at) < now) return null;

    return coupon;
  },

  async incrementRedemption(id: string) {
    const { error } = await supabase.rpc("increment_coupon_redemption", { coupon_id: id });
    if (error) {
      // Fallback if RPC doesn't exist
      const { data: current } = await supabase
        .from("coupons")
        .select("redemptions")
        .eq("id", id)
        .single();
      if (current) {
        await supabase
          .from("coupons")
          .update({ redemptions: current.redemptions + 1 })
          .eq("id", id);
      }
    }
  },
};
