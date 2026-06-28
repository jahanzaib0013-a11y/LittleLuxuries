import { supabase, Database } from "./supabase";
import { formatPkr } from "./format-currency";
import { calculateTier } from "./customers";

// Types
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderWithItems = Order & {
  order_items?: {
    product_name: string;
    product_image_url?: string | null;
    unit_price: number;
    quantity: number;
  }[];
  order_status_history?: { status: string }[];
  /** Customer loyalty tier, joined in by getOrders(). */
  customer_tier?: string;
};
export type OrderStatusHistoryItem = Database["public"]["Tables"]["order_status_history"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];
export type PaymentStatus = Database["public"]["Tables"]["orders"]["Row"]["payment_status"];

/** Fields we can restore on checkout for returning shoppers */
export type CheckoutPrefillSnapshot = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country?: string;
};

export type CheckoutPrefillSource = "saved_profile" | "last_order";

export type CartItem = {
  product_id: string;
  product_name: string;
  product_image_url?: string | null;
  size: string;
  quantity: number;
  unit_price: number;
  variant?: string;
};

/** Fulfilment menu: allow packing only after the order is confirmed. */
export function canMarkOrderPacked(status: OrderStatus | string): boolean {
  if (status === "cancelled" || status === "refunded") return false;
  return status === "order_confirmed";
}

export function canMarkOrderShipped(status: OrderStatus | string): boolean {
  if (status === "cancelled" || status === "refunded") return false;
  return status === "packed";
}

export function canMarkOrderDelivered(status: OrderStatus | string): boolean {
  if (status === "cancelled" || status === "refunded") return false;
  return status === "shipped";
}

export type ShippingAddress = {
  first_name: string;
  last_name: string;
  street_address: string;
  city: string;
  postal_code: string;
  country?: string;
};

export type CreateOrderInput = {
  // Customer info
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;

  // Shipping
  shipping_address: ShippingAddress;

  // Financial
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount?: number;
  total_amount: number;
  currency?: string;

  // Items
  items: CartItem[];

  // Acquisition data
  acquisition_data?: {
    acquisition_source: string;
    acquisition_channel?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    referral_source?: string;
    landing_page?: string;
    referrer_url?: string;
  };

  // Notes
  customer_notes?: string;
};

/** Keep one default saved address per customer (used for professional checkout prefill). */
async function syncDefaultShippingAddressForCustomer(
  customerId: string,
  input: CreateOrderInput,
): Promise<void> {
  const country = input.shipping_address.country || "PK";
  const payload = {
    first_name: input.shipping_address.first_name,
    last_name: input.shipping_address.last_name,
    street_address: input.shipping_address.street_address,
    city: input.shipping_address.city,
    postal_code: input.shipping_address.postal_code,
    country,
    is_default: true,
  };

  const { data: existing } = await supabase
    .from("shipping_addresses")
    .select("id")
    .eq("customer_id", customerId)
    .eq("is_default", true)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("shipping_addresses")
      .update(payload)
      .eq("id", existing.id);
    if (error) console.error("shipping_addresses update:", error);
  } else {
    const { error } = await supabase.from("shipping_addresses").insert({
      customer_id: customerId,
      ...payload,
    });
    if (error) console.error("shipping_addresses insert:", error);
  }
}

// Order Service
export const orderService = {
  // Create a new order
  async createOrder(
    input: CreateOrderInput,
  ): Promise<{ order: Order | null; error: string | null }> {
    try {
      // 0. Check inventory availability before creating order
      for (const item of input.items) {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("units, name")
          .eq("id", item.product_id)
          .single();

        if (productError) {
          return { order: null, error: `Failed to check inventory for ${item.product_name}` };
        }

        const availableUnits = product?.units || 0;
        if (availableUnits < item.quantity) {
          return {
            order: null,
            error: `Insufficient stock for ${product?.name || item.product_name}. Available: ${availableUnits}, Requested: ${item.quantity}`,
          };
        }
      }

      // 1. Create or get customer
      let customerId: string | null = null;

      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, acquisition_source, acquisition_channel, utm_source, referral_source")
        .eq("email", input.customer_email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update customer info with acquisition data if not already set
        const updateData: any = {
          first_name: input.customer_first_name,
          last_name: input.customer_last_name,
          phone: input.customer_phone,
        };

        // Add acquisition data if customer doesn't have it yet OR if UTM data is available
        if (input.acquisition_data) {
          // Only update acquisition_source if customer doesn't have one or if UTM data is better than existing
          if (
            !existingCustomer.acquisition_source ||
            (input.acquisition_data.acquisition_source &&
              input.acquisition_data.acquisition_source !== "direct")
          ) {
            updateData.acquisition_source = input.acquisition_data.acquisition_source;
          }

          // Always update UTM fields if they're available
          if (input.acquisition_data.utm_source) {
            updateData.utm_source = input.acquisition_data.utm_source;
            updateData.utm_medium = input.acquisition_data.utm_medium;
            updateData.utm_campaign = input.acquisition_data.utm_campaign;
            updateData.utm_content = input.acquisition_data.utm_content;
            updateData.utm_term = input.acquisition_data.utm_term;
          }

          // Always update acquisition_channel if available
          if (input.acquisition_data.acquisition_channel) {
            updateData.acquisition_channel = input.acquisition_data.acquisition_channel;
          }

          // Update referral_source if provided
          if (input.acquisition_data.referral_source) {
            updateData.referral_source = input.acquisition_data.referral_source;
          }
        }

        await supabase.from("customers").update(updateData).eq("id", customerId);
      } else {
        // Create new customer with acquisition data
        const customerData: any = {
          email: input.customer_email,
          first_name: input.customer_first_name,
          last_name: input.customer_last_name,
          phone: input.customer_phone,
        };

        // Add acquisition data if provided
        if (input.acquisition_data) {
          customerData.acquisition_source = input.acquisition_data.acquisition_source;
          customerData.acquisition_channel = input.acquisition_data.acquisition_channel;
          customerData.utm_source = input.acquisition_data.utm_source;
          customerData.utm_medium = input.acquisition_data.utm_medium;
          customerData.utm_campaign = input.acquisition_data.utm_campaign;
          customerData.utm_content = input.acquisition_data.utm_content;
          customerData.utm_term = input.acquisition_data.utm_term;
          customerData.referral_source = input.acquisition_data.referral_source;
        }

        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert(customerData)
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer?.id || null;
      }

      // 2. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          customer_email: input.customer_email,
          customer_first_name: input.customer_first_name,
          customer_last_name: input.customer_last_name,
          customer_phone: input.customer_phone,

          shipping_first_name: input.shipping_address.first_name,
          shipping_last_name: input.shipping_address.last_name,
          shipping_street_address: input.shipping_address.street_address,
          shipping_city: input.shipping_address.city,
          shipping_postal_code: input.shipping_address.postal_code,
          shipping_country: input.shipping_address.country || "PK",

          subtotal: input.subtotal,
          tax_amount: input.tax_amount,
          shipping_amount: input.shipping_amount,
          discount_amount: input.discount_amount || 0,
          total_amount: input.total_amount,
          currency: input.currency || "PKR",

          status: "order_placed",
          payment_status: "pending",
          tracking_number: `LL-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
          payment_provider: "cod",
          customer_notes: input.customer_notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error("Failed to create order");

      // Record initial status in history
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "order_placed",
        notes: "Order initially placed at checkout.",
      });

      // Create order items and decrement inventory
      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.unit_price * item.quantity,
        size: item.size,
        variant: item.variant,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      // Decrement product inventory for each item
      for (const item of input.items) {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("units")
          .eq("id", item.product_id)
          .single();

        if (productError) {
          console.error(`Error fetching product ${item.product_id}:`, productError);
          continue;
        }

        const currentUnits = product?.units || 0;
        const newUnits = Math.max(0, currentUnits - item.quantity);

        const { error: updateError } = await supabase
          .from("products")
          .update({ units: newUnits })
          .eq("id", item.product_id);

        if (updateError) {
          console.error(`Error updating inventory for product ${item.product_id}:`, updateError);
        }
      }

      if (customerId) {
        await syncDefaultShippingAddressForCustomer(customerId, input);
      }

      // NOTE: the "order placed" email is sent by the checkout component after
      // this resolves. Server functions invoked from inside this library do NOT
      // run as a server RPC (they execute locally in the browser with no env),
      // so email triggering lives in the component layer.

      return { order, error: null };
    } catch (err: any) {
      console.error("Error creating order:", err);
      return { order: null, error: err.message || "Failed to create order" };
    }
  },

  /** Saved default address on the customer profile; falls back to latest order (legacy). */
  async getLatestCheckoutPrefillByEmail(email: string): Promise<{
    snapshot: CheckoutPrefillSnapshot | null;
    source: CheckoutPrefillSource | null;
    error: string | null;
  }> {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { snapshot: null, source: null, error: null };
    }
    try {
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .select(
          `
          id,
          email,
          first_name,
          last_name,
          phone,
          shipping_addresses (
            first_name,
            last_name,
            street_address,
            city,
            postal_code,
            country,
            is_default,
            updated_at
          )
        `,
        )
        .ilike("email", trimmed)
        .maybeSingle();

      if (custErr) throw custErr;

      if (customer) {
        const rows = (customer as { shipping_addresses?: Array<Record<string, unknown>> })
          .shipping_addresses;
        if (rows && rows.length > 0) {
          const sorted = [...rows].sort((a, b) => {
            const da = new Date(String(a.updated_at ?? 0)).getTime();
            const db = new Date(String(b.updated_at ?? 0)).getTime();
            return db - da;
          });
          const addr = sorted.find((r) => r.is_default === true) ?? sorted[0];
          return {
            snapshot: {
              email: (customer as { email: string }).email,
              firstName: String(addr.first_name ?? (customer as { first_name: string }).first_name),
              lastName: String(addr.last_name ?? (customer as { last_name: string }).last_name),
              phone: String((customer as { phone?: string | null }).phone ?? ""),
              streetAddress: String(addr.street_address ?? ""),
              city: String(addr.city ?? ""),
              postalCode: String(addr.postal_code ?? ""),
              country: String(addr.country ?? "PK"),
            },
            error: null,
            source: "saved_profile",
          };
        }
      }

      const { data: orderRow, error: ordErr } = await supabase
        .from("orders")
        .select(
          "customer_email, customer_first_name, customer_last_name, customer_phone, shipping_first_name, shipping_last_name, shipping_street_address, shipping_city, shipping_postal_code, shipping_country",
        )
        .ilike("customer_email", trimmed)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ordErr) throw ordErr;
      if (!orderRow) return { snapshot: null, source: null, error: null };

      return {
        snapshot: {
          email: orderRow.customer_email,
          firstName: orderRow.shipping_first_name || orderRow.customer_first_name,
          lastName: orderRow.shipping_last_name || orderRow.customer_last_name,
          phone: orderRow.customer_phone ?? "",
          streetAddress: orderRow.shipping_street_address,
          city: orderRow.shipping_city,
          postalCode: orderRow.shipping_postal_code,
          country: orderRow.shipping_country ?? "PK",
        },
        source: "last_order",
        error: null,
      };
    } catch (err: any) {
      console.error("Error loading checkout prefill:", err);
      return { snapshot: null, source: null, error: err.message || "Failed to load saved address" };
    }
  },

  // Get order by ID
  async getOrder(
    orderId: string,
  ): Promise<{ order: Order | null; items: OrderItem[]; error: string | null }> {
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      return { order, items: items || [], error: null };
    } catch (err: any) {
      console.error("Error fetching order:", err);
      return { order: null, items: [], error: err.message || "Failed to fetch order" };
    }
  },

  // Get order by order number
  async getOrderByNumber(
    orderNumber: string,
  ): Promise<{ order: Order | null; items: OrderItem[]; error: string | null }> {
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error("Order not found");

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (itemsError) throw itemsError;

      return { order, items: items || [], error: null };
    } catch (err: any) {
      console.error("Error fetching order:", err);
      return { order: null, items: [], error: err.message || "Failed to fetch order" };
    }
  },

  // Get all orders (for admin)
  async getAllOrders(options?: {
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
    dateRange?: { from: string; to: string };
  }): Promise<{ orders: OrderWithItems[]; count: number; error: string | null }> {
    try {
      let query = supabase
        .from("orders")
        .select(
          "*, order_items(product_name, product_image_url, unit_price, quantity), order_status_history(status)",
          { count: "exact" },
        );

      if (options?.status) {
        query = query.eq("status", options.status);
      }

      if (options?.payment_status) {
        query = query.eq("payment_status", options.payment_status);
      }

      if (options?.dateRange) {
        query = query
          .gte("created_at", options.dateRange.from)
          .lte("created_at", options.dateRange.to);
      }

      const orderColumn = options?.orderBy?.column || "created_at";
      const ascending = options?.orderBy?.ascending ?? false;
      query = query.order(orderColumn, { ascending });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch customer tiers for orders that have customer_email
      // Compute each customer's tier LIVE from their paid orders (same rule as
      // the Customers page) so the order/WhatsApp tier matches what admins see.
      // The stored customers.tier column is stale, so we don't rely on it.
      const tierCache = new Map<string, string>();
      const tierForEmail = async (email: string): Promise<string> => {
        const cached = tierCache.get(email);
        if (cached) return cached;
        const { data: custOrders } = await supabase
          .from("orders")
          .select("status, payment_status")
          .eq("customer_email", email);
        const paid = (custOrders || []).filter(
          (o: { status: string; payment_status: string | null }) =>
            o.payment_status === "completed" && o.status !== "cancelled" && o.status !== "refunded",
        ).length;
        const t = calculateTier(paid);
        tierCache.set(email, t);
        return t;
      };

      const ordersWithTier = await Promise.all(
        (data || []).map(async (order: any) => ({
          ...order,
          customer_tier: order.customer_email ? await tierForEmail(order.customer_email) : "Standard",
        })),
      );

      return { orders: ordersWithTier, count: count || 0, error: null };
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      return { orders: [], count: 0, error: err.message || "Failed to fetch orders" };
    }
  },

  // Get orders for a customer
  async getCustomerOrders(customerId: string): Promise<{ orders: Order[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { orders: data || [], error: null };
    } catch (err: any) {
      console.error("Error fetching customer orders:", err);
      return { orders: [], error: err.message || "Failed to fetch orders" };
    }
  },

  // Update order status
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1. Get current status for previous_status reference and existing payment status
      const { data: existing } = await supabase
        .from("orders")
        .select(
          "status, payment_status, total_amount, order_number, customer_email, customer_first_name, customer_last_name, tracking_number",
        )
        .eq("id", orderId)
        .single();
      const previousStatus = existing?.status;
      const existingPaymentStatus = existing?.payment_status;
      const orderAmount = existing?.total_amount;

      const updates: Record<string, unknown> = { status };

      // Confirming payment always marks it collected and stamps paid_at — even
      // if the order had no prior payment_status (otherwise it stays invisible
      // to revenue). Skip only if it's already completed (keep original paid_at).
      if (status === "payment_confirmed" && existingPaymentStatus !== "completed") {
        updates.payment_status = "completed";
        updates.paid_at = new Date().toISOString();
      }

      // 2. Update the order
      const { error } = await supabase.from("orders").update(updates).eq("id", orderId);

      if (error) throw error;

      // 3. Restore inventory if order is being cancelled
      if (status === "cancelled" && previousStatus !== "cancelled") {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);

        if (orderItems) {
          for (const item of orderItems) {
            const { data: product } = await supabase
              .from("products")
              .select("units")
              .eq("id", item.product_id)
              .single();

            if (product) {
              const currentUnits = product.units || 0;
              const newUnits = currentUnits + item.quantity;

              await supabase.from("products").update({ units: newUnits }).eq("id", item.product_id);
            }
          }
        }
      }

      // 4. Record in history with revenue impact note if cancelling after payment
      let historyNotes = notes;
      if (status === "cancelled" && existingPaymentStatus === "completed") {
        historyNotes = `Order cancelled after payment confirmation. Revenue of ${formatPkr(Number(orderAmount))} excluded from totals. Inventory restored. ${notes || ""}`;
      } else if (status === "cancelled") {
        historyNotes = `Order cancelled. Inventory restored. ${notes || ""}`;
      }

      await supabase.from("order_status_history").insert({
        order_id: orderId,
        status: status,
        previous_status: previousStatus,
        notes: historyNotes,
      });

      // NOTE: status emails are sent by the calling component (dashboard/orders),
      // because server functions invoked from this library do not run as a
      // server RPC.
      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error updating order status:", err);
      return { success: false, error: err.message || "Failed to update order status" };
    }
  },

  /** Permanently removes the order. `order_items` and `order_status_history` cascade (see migrations). */
  async deleteOrder(orderId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // .select() returns the rows actually deleted. A plain delete reports
      // success even when RLS or permissions silently remove 0 rows, which is
      // why "deleted" orders kept reappearing — verify a row really went away.
      const { data, error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        return {
          success: false,
          error: "Order was not deleted — you may not have permission (check RLS policies).",
        };
      }
      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error deleting order:", err);
      return { success: false, error: err.message || "Failed to delete order" };
    }
  },

  // Update payment status and optionally order status
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    options?: {
      orderStatus?: OrderStatus;
      external_transaction_id?: string;
      external_payment_link?: string;
      paid_at?: string;
    },
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Decide whether this payment change should also advance the order status.
      // Routing the status change through updateOrderStatus keeps emails in one
      // place (no duplicate / contradicting sends).
      let targetStatus: OrderStatus | undefined = options?.orderStatus;
      if (!targetStatus && paymentStatus === "completed") {
        const { data: cur } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .single();
        const current = cur?.status as OrderStatus | undefined;
        // Completing payment confirms the order. For COD that's typically after
        // delivery, so "delivered" SHOULD advance to payment_confirmed. We only
        // skip mid-fulfilment (packed/shipped) and terminal states.
        const skip: OrderStatus[] = [
          "packed",
          "shipped",
          "payment_confirmed",
          "cancelled",
          "refunded",
        ];
        if (current && !skip.includes(current)) {
          targetStatus = "payment_confirmed";
        }
      }

      // 1. Persist payment-only fields (status, if any, handled below).
      const updates: Record<string, unknown> = { payment_status: paymentStatus };
      if (options?.external_transaction_id) {
        updates.external_transaction_id = options.external_transaction_id;
      }
      if (options?.external_payment_link) {
        updates.external_payment_link = options.external_payment_link;
      }
      if (paymentStatus === "completed") {
        updates.paid_at = options?.paid_at ?? new Date().toISOString();
      } else if (options?.paid_at !== undefined) {
        updates.paid_at = options.paid_at;
      }

      const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
      if (error) throw error;

      // 2. Route any status change through the single chokepoint (sends one email).
      if (targetStatus) {
        await orderService.updateOrderStatus(
          orderId,
          targetStatus,
          `Payment status updated to ${paymentStatus}`,
        );
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error updating payment status:", err);
      return { success: false, error: err.message || "Failed to update payment status" };
    }
  },

  // Record that a WhatsApp message was sent
  async recordWhatsAppSent(orderId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from("order_status_history").insert({
        order_id: orderId,
        status: "whatsapp_sent",
        notes: "WhatsApp confirmation message triggered from dashboard.",
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error recording WhatsApp sent:", err);
      return { success: false, error: err.message || "Failed to record WhatsApp status" };
    }
  },

  // Initiate AssanPay payment
  async initiateAssanPayPayment(
    orderId: string,
    assanPayData: {
      transactionId: string;
      completeLink: string;
    },
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_provider: "assanpay",
          payment_status: "initiated",
          external_transaction_id: assanPayData.transactionId,
          external_payment_link: assanPayData.completeLink,
          status: "payment_initiated",
        })
        .eq("id", orderId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error initiating AssanPay payment:", err);
      return { success: false, error: err.message || "Failed to initiate payment" };
    }
  },

  // Update tracking info
  async updateTracking(
    orderId: string,
    trackingNumber: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          tracking_number: trackingNumber,
          status: "shipped",
          shipped_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err: any) {
      console.error("Error updating tracking:", err);
      return { success: false, error: err.message || "Failed to update tracking" };
    }
  },

  // Get order statistics (total_revenue / revenue_mtd = cash collected when marked paid, not order placement)
  async getOrderStats(): Promise<{
    total_orders: number;
    pending_payment: number;
    paid: number;
    order_confirmed: number;
    payment_confirmed: number;
    packed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    total_revenue: number;
    revenue_mtd: number;
    avg_monthly_earning: number;
    order_placed: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("status, total_amount, payment_status, paid_at, created_at");

      if (error) throw error;

      const countsTowardCollectedRevenue = (o: { status: string; payment_status: string | null }) =>
        o.payment_status === "completed" && o.status !== "cancelled" && o.status !== "refunded";

      const now = new Date();
      const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const mtdEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const mtdStartMs = mtdStart.getTime();
      const mtdEndMs = mtdEnd.getTime();

      const stats = {
        total_orders: data?.length || 0,
        order_placed: data?.filter((o: any) => o.status === "order_placed").length || 0,
        order_confirmed: data?.filter((o: any) => o.status === "order_confirmed").length || 0,
        payment_confirmed: data?.filter((o: any) => o.status === "payment_confirmed").length || 0,
        pending_payment: data?.filter((o: any) => o.status === "pending_payment").length || 0,
        paid:
          data?.filter((o: any) => o.status === "paid" || o.payment_status === "completed")
            .length || 0,
        packed: data?.filter((o: any) => o.status === "packed").length || 0,
        shipped: data?.filter((o: any) => o.status === "shipped").length || 0,
        delivered: data?.filter((o: any) => o.status === "delivered").length || 0,
        cancelled: data?.filter((o: any) => o.status === "cancelled").length || 0,
        total_revenue:
          data?.reduce((sum: number, o: any) => {
            return sum + (countsTowardCollectedRevenue(o) ? Number(o.total_amount) : 0);
          }, 0) || 0,
        revenue_mtd:
          data?.reduce((sum: number, o: any) => {
            if (!countsTowardCollectedRevenue(o) || !o.paid_at) return sum;
            const t = new Date(o.paid_at).getTime();
            if (t >= mtdStartMs && t <= mtdEndMs) return sum + Number(o.total_amount);
            return sum;
          }, 0) || 0,
        // Real average: total collected revenue ÷ number of months that had sales.
        avg_monthly_earning: (() => {
          const collected = (data || []).filter(countsTowardCollectedRevenue);
          const total = collected.reduce((sum, o: any) => sum + Number(o.total_amount), 0);
          const months = new Set(
            collected.map((o: any) => {
              const d = new Date(o.paid_at || o.created_at);
              return `${d.getFullYear()}-${d.getMonth()}`;
            }),
          );
          return months.size > 0 ? Math.round(total / months.size) : 0;
        })(),
        error: null,
      };

      return stats;
    } catch (err: any) {
      console.error("Error fetching order stats:", err);
      return {
        total_orders: 0,
        pending_payment: 0,
        paid: 0,
        order_confirmed: 0,
        payment_confirmed: 0,
        packed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        total_revenue: 0,
        revenue_mtd: 0,
        avg_monthly_earning: 0,
        order_placed: 0,
        error: err.message || "Failed to fetch stats",
      };
    }
  },

  // Get recent orders with items (for admin dashboard)
  async getRecentOrdersWithItems(limit: number = 5): Promise<{
    orders: (Order & { items: OrderItem[] })[];
    error: string | null;
  }> {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const ordersWithItems = await Promise.all(
        (orders || []).map(async (order) => {
          const { data: items } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);
          return { ...order, items: items || [] };
        }),
      );

      return { orders: ordersWithItems, error: null };
    } catch (err: any) {
      console.error("Error fetching recent orders:", err);
      return { orders: [], error: err.message || "Failed to fetch recent orders" };
    }
  },

  // Get top selling products
  async getTopSellers(limit: number = 3): Promise<{
    topSellers: { name: string; collection: string; sales: number }[];
    error: string | null;
  }> {
    try {
      const { data: items, error } = await supabase
        .from("order_items")
        .select("product_name, quantity, product_id");

      if (error) throw error;

      // Group by product name
      const salesMap = new Map<string, { name: string; collection: string; sales: number }>();

      for (const item of items || []) {
        const name = item.product_name;
        const qty = item.quantity || 1;
        if (salesMap.has(name)) {
          salesMap.get(name)!.sales += qty;
        } else {
          salesMap.set(name, {
            name,
            collection: "Collection", // Defaulting to Collection
            sales: qty,
          });
        }
      }

      const sorted = Array.from(salesMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit);

      return { topSellers: sorted, error: null };
    } catch (err: any) {
      console.error("Error fetching top sellers:", err);
      return { topSellers: [], error: err.message || "Failed to fetch top sellers" };
    }
  },

  // Get real-time VIP activity from the database
  async getVIPActivity(): Promise<{ activities: any[]; error: string | null }> {
    try {
      // Fetch customers with their orders to determine tiers
      const { data: allCustomers, error: customerError } = await supabase
        .from("customers")
        .select(
          "id, first_name, last_name, phone, created_at, orders!left(id, total_amount, created_at, status)",
        );

      if (customerError) throw customerError;

      const activities: any[] = [];

      allCustomers?.forEach((c: any) => {
        const orderCount = c.orders?.length || 0;
        let tier = "Standard";
        if (orderCount >= 5) tier = "Platinum";
        else if (orderCount >= 2) tier = "Gold";
        else if (orderCount >= 1) tier = "Silver";

        // Only focus on VIPs (Gold and Platinum) for the Pulse
        if (tier === "Gold" || tier === "Platinum") {
          // 1. Add their recent orders as "Real" purchase activity
          c.orders?.forEach((o: any) => {
            // Skip cancelled or refunded orders in the VIP Pulse for a cleaner, high-intent feed
            if (o.status === "cancelled" || o.status === "refunded") return;

            // COD: payment_confirmed = cash collected = a completed purchase.
            const action =
              o.status === "delivered" || o.status === "shipped" || o.status === "payment_confirmed"
                ? "completed purchase"
                : "placed an order";

            activities.push({
              name: `${c.first_name} ${c.last_name}`,
              tier: tier,
              date: o.created_at,
              action,
              detail: formatPkr(Number(o.total_amount)),
              phone: c.phone,
            });
          });

          // 2. Add "Tier Milestone" activity
          activities.push({
            name: `${c.first_name} ${c.last_name}`,
            tier: tier,
            date: c.created_at,
            action: `Achieved ${tier} status`,
            detail: `${orderCount} lifetime orders`,
            phone: c.phone,
          });
        }
      });

      // Sort by date (newest first) and return top 5
      const sorted = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      return { activities: sorted, error: null };
    } catch (err: any) {
      console.error("Error fetching VIP activity:", err);
      return { activities: [], error: err.message };
    }
  },

  /** Fetches full status history for an order */
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryItem[]> {
    try {
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching status history:", err);
      return [];
    }
  },
};

// Real-time subscriptions
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  return supabase
    .channel("orders-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      async () => {
        const { orders } = await orderService.getAllOrders({ limit: 50 });
        callback(orders);
      },
    )
    .subscribe();
};

export const subscribeToOrder = (orderId: string, callback: (order: Order) => void) => {
  return supabase
    .channel(`order-${orderId}-changes`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        callback(payload.new as Order);
      },
    )
    .subscribe();
};
