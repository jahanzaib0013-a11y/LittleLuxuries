import { useEffect, useState } from "react";
import { orderService, subscribeToOrders, Order } from "@/lib/order-service";
import { subscribeAdminNotifications, type AdminNotification } from "@/lib/admin-notifications-bus";
import { formatPkr } from "@/lib/format-currency";

type Notification = AdminNotification;

/**
 * useAdminNotifications – fetches recent orders and subscribes to realtime
 * events to produce a list of notifications for the admin dashboard.
 */
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Helper to add a new notification, deduping by id+type
  const addNotification = (n: Notification) => {
    setNotifications((prev) => {
      if (prev.find((item) => item.id === n.id && item.type === n.type)) return prev;
      return [n, ...prev].slice(0, 20);
    });
  };

  // External pushes (e.g. Instagram / Story published via Manus)
  useEffect(() => {
    return subscribeAdminNotifications((n) => {
      setNotifications((prev) => {
        if (prev.find((item) => item.id === n.id && item.type === n.type)) return prev;
        return [n, ...prev].slice(0, 20);
      });
    });
  }, []);

  // Initial fetch – recent orders
  useEffect(() => {
    async function loadRecent() {
      const { orders } = await orderService.getRecentOrdersWithItems(5);
      orders.forEach((order) => {
        addNotification({
          id: order.id,
          type: "order",
          message: "New Order",
          description: `${order.customer_first_name} ${order.customer_last_name} placed an order for ${formatPkr(Number(order.total_amount))}`,
          timestamp: new Date(order.created_at ?? Date.now()),
        });
      });
    }
    loadRecent();
  }, []);

  // Subscribe to payment failures and order updates
  useEffect(() => {
    const sub = subscribeToOrders((orders: Order[]) => {
      orders.forEach((order: Order) => {
        if (order.payment_status === "failed") {
          addNotification({
            id: order.id,
            type: "payment",
            message: "Payment Failed",
            description: `Payment of ${formatPkr(Number(order.total_amount))} for order #${order.order_number?.slice(-6)} was declined.`,
            timestamp: new Date(order.updated_at ?? Date.now()),
          });
        }
        // Also notify about new orders in realtime if we haven't seen them
        addNotification({
          id: order.id,
          type: "order",
          message: "New Order",
          description: `${order.customer_first_name} placed a new order.`,
          timestamp: new Date(order.created_at ?? Date.now()),
        });
      });
    });
    return () => {
      sub?.unsubscribe?.();
    };
  }, []);

  // Stock-low detection
  useEffect(() => {
    const LOW_STOCK_THRESHOLD = 5;
    async function checkStock() {
      const { topSellers } = await orderService.getTopSellers();
      topSellers.forEach((p) => {
        if (p.sales <= LOW_STOCK_THRESHOLD) {
          addNotification({
            id: p.name,
            type: "stock",
            message: "Low Stock Alert",
            description: `${p.name} has only ${p.sales} units left in circulation.`,
            timestamp: new Date(),
          });
        }
      });
    }
    checkStock();
    const interval = setInterval(checkStock, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return { notifications, clearNotifications };
}
