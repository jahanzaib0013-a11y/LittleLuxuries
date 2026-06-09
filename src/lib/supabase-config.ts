import { supabase } from "./supabase";

export class SupabaseConfig {
  static async testConnection() {
    try {
      const { data, error } = await supabase.from("content").select("count").single();

      if (error) {
        console.error("Supabase connection failed:", error);
        return { success: false, error: error.message };
      }

      return { success: true, message: "Connected to Supabase successfully!" };
    } catch (err) {
      console.error("Supabase connection error:", err);
      return { success: false, error: "Failed to connect to Supabase" };
    }
  }

  static async initializeDatabase() {
    try {
      // Check if content exists
      const { data: existingContent, error: contentError } = await supabase
        .from("content")
        .select("*")
        .eq("id", "default")
        .single();

      if (contentError && contentError.code === "PGRST116") {
        // Content doesn't exist, initialize with default data
        const defaultContent = {
          id: "default",
          hero_banner: {
            title: "Hand-crafted for Little Luxuries",
            subtitle: "Premium baby essentials with love in every stitch",
            badge_text: "Hand-crafted",
            headline:
              "Discover our collection of premium baby essentials, thoughtfully designed for comfort and style.",
            image_url: "/hero-baby.jpg",
          },
          announcement_bar: {
            is_active: true,
            promises: [
              {
                title: "Ethically Made",
                description: "Crafted with sustainable materials and fair trade practices",
              },
              {
                title: "Heirloom Quality",
                description: "Designed to last through generations of little ones",
              },
              {
                title: "Soft on Skin",
                description: "Gentle fabrics perfect for delicate baby skin",
              },
            ],
          },
          layout: "Editorial Grid",
          promo_banner: {
            isActive: false,
            placements: {
              top: true,
              stickyBottom: false,
              aboveBrandPromises: false,
              belowBrandPromises: false,
            },
            variant: "festival",
            eyebrow: "Limited time",
            headline: "Seasonal Sale — 20% off",
            description: "On selected heirloom pieces.",
            promoCode: "LUXE10",
            showPromoCode: true,
            buttonLabel: "Shop the sale",
            buttonLink: "/shop",
            showButton: true,
            iconName: "Gift",
            textAlign: "center",
            backgroundTheme: "gold",
            endsAt: null,
          },
        };

        const { data, error } = await supabase
          .from("content")
          .insert(defaultContent)
          .select()
          .single();

        if (error) {
          console.error("Error initializing content:", error);
          return { success: false, error: error.message };
        }

        return { success: true, message: "Database initialized with default content" };
      }

      return { success: true, message: "Database already initialized" };
    } catch (err) {
      console.error("Database initialization error:", err);
      return { success: false, error: "Failed to initialize database" };
    }
  }

  static getEnvironmentInfo() {
    return {
      url: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      isConfigured: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
    };
  }
}
