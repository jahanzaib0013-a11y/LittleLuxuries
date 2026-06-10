import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * True only when a real Supabase backend is configured. Lets data loaders tell
 * "this is a no-backend demo build → use bundled sample data" apart from "the
 * backend is configured but the request failed → surface a real error", instead
 * of silently showing demo products when the live DB is unreachable.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Little Luxuries] Missing Supabase environment variables — DB features will be unavailable.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
);

// Types for our database
export interface Database {
  public: {
    Tables: {
      content: {
        Row: {
          id: string;
          hero_banner: {
            title: string;
            subtitle: string;
            badge_text: string;
            headline: string;
            image_url: string;
          };
          announcement_bar: {
            is_active: boolean;
            promises: {
              title: string;
              description: string;
              icon_name?: string;
            }[];
          };
          layout: string;
          promo_banner: Record<string, unknown>;
          animation_style?: string;
          background_animation?: string;
          craft_story?: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["content"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["content"]["Insert"]>;
      };
      site_lists: {
        Row: {
          id: string;
          data: unknown;
          updated_at: string;
        };
        Insert: { id: string; data: unknown };
        Update: Partial<{ id: string; data: unknown }>;
      };
      blogs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          body: string;
          cover_image_url: string | null;
          video_url: string | null;
          status: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["blogs"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["blogs"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          image_url: string;
          category: string;
          variant: string;
          badge?: string;
          description: string;
          sizes: string[];
          colors?: import("@/lib/product-colors").ProductColor[];
          size_chart?: import("@/lib/size-chart").SizeChart;
          secondary_images?: string[];
          sustainability?: string;
          care_instructions?: string;
          gift_wrapping?: string;
          gender?: string;
          status: string;
          scheduled_publish_at?: string;
          units: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string;
          tier?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["customers"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      shipping_addresses: {
        Row: {
          id: string;
          customer_id: string;
          first_name: string;
          last_name: string;
          street_address: string;
          city: string;
          postal_code: string;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["shipping_addresses"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["shipping_addresses"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id?: string;
          customer_email: string;
          customer_first_name: string;
          customer_last_name: string;
          customer_phone?: string;
          shipping_first_name: string;
          shipping_last_name: string;
          shipping_street_address: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_country: string;
          subtotal: number;
          tax_amount: number;
          shipping_amount: number;
          discount_amount: number;
          total_amount: number;
          currency: string;
          status:
            | "order_placed"
            | "order_confirmed"
            | "payment_confirmed"
            | "pending_payment"
            | "payment_initiated"
            | "paid"
            | "packed"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded";
          payment_provider?: string;
          payment_status:
            | "pending"
            | "initiated"
            | "processing"
            | "completed"
            | "failed"
            | "refunded";
          external_transaction_id?: string;
          external_payment_link?: string;
          paid_at?: string;
          tracking_number?: string;
          shipped_at?: string;
          delivered_at?: string;
          customer_notes?: string;
          admin_notes?: string;
          metadata?: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          "id" | "order_number" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id?: string;
          product_name: string;
          product_sku?: string;
          product_image_url?: string;
          unit_price: number;
          quantity: number;
          total_price: number;
          size?: string;
          color?: string;
          variant?: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          previous_status?: string;
          notes?: string;
          created_by?: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["order_status_history"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Insert"]>;
      };
      store_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          type: "string" | "number" | "boolean" | "json";
          description?: string;
          updated_at: string;
          updated_by?: string;
        };
        Insert: Omit<Database["public"]["Tables"]["store_settings"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["store_settings"]["Insert"]>;
      };
    };
  };
}
