import { supabase, Database } from "./supabase";

// Content management
export const contentService = {
  // Get current content
  async getContent() {
    const { data, error } = await supabase.from("content").select("*").single();

    if (error) {
      console.error("Error fetching content:", error);
      return null;
    }

    return data;
  },

  // Update content
  async updateContent(updates: Partial<Database["public"]["Tables"]["content"]["Update"]>) {
    const { data, error } = await supabase
      .from("content")
      .update(updates)
      .eq("id", "default")
      .select()
      .single();

    if (error) {
      console.error("Error updating content:", error);
      return null;
    }

    return data;
  },

  // Initialize content if it doesn't exist
  async initializeContent(defaultContent: Database["public"]["Tables"]["content"]["Insert"]) {
    const { data, error } = await supabase
      .from("content")
      .insert({ ...defaultContent, id: "default" })
      .select()
      .single();

    if (error) {
      console.error("Error initializing content:", error);
      return null;
    }

    return data;
  },
};

// Products management
export const productService = {
  // Get all products
  async getProducts(status?: string) {
    let query = supabase.from("products").select("*");
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return data || [];
  },

  // Get product by ID
  async getProduct(id: string) {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }

    return data;
  },

  // Create product
  async createProduct(product: Database["public"]["Tables"]["products"]["Insert"]) {
    const { data, error } = await supabase.from("products").insert(product).select().single();

    if (error) {
      console.error("Error creating product:", error);
      return null;
    }

    return data;
  },

  // Update product
  async updateProduct(id: string, updates: Database["public"]["Tables"]["products"]["Update"]) {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return null;
    }

    return data;
  },

  // Delete product
  async deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      return false;
    }

    return true;
  },

  // Get low stock products count
  async getLowStockCount() {
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .lt("units", 5)
      .gt("units", 0);

    if (error) {
      console.error("Error fetching low stock count:", error);
      return 0;
    }

    return count || 0;
  },
};

// Real-time subscriptions
export const subscribeToContent = (
  callback: (content: Database["public"]["Tables"]["content"]["Row"]) => void,
) => {
  return supabase
    .channel("content-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "content",
        filter: "id=eq.default",
      },
      (payload) => {
        if (payload.eventType === "UPDATE") {
          callback(payload.new as Database["public"]["Tables"]["content"]["Row"]);
        }
      },
    )
    .subscribe();
};

export const subscribeToProducts = (
  callback: (products: Database["public"]["Tables"]["products"]["Row"][]) => void,
) => {
  return supabase
    .channel("products-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products",
      },
      async () => {
        const products = await productService.getProducts();
        callback(products);
      },
    )
    .subscribe();
};
