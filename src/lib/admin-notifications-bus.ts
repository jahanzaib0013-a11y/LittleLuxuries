/**
 * Lightweight pub/sub so any client code (e.g. Manus publish flows) can push
 * items into the admin header notification list. AdminLayout's hook subscribes
 * on mount and merges into local state.
 */

export type AdminNotificationType = "order" | "payment" | "stock" | "social_feed" | "social_story";

export type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  message: string;
  description: string;
  timestamp: Date;
};

type Listener = (n: AdminNotification) => void;

const listeners = new Set<Listener>();

export function subscribeAdminNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function pushAdminNotification(n: AdminNotification): void {
  const ts =
    n.timestamp instanceof Date
      ? n.timestamp
      : n.timestamp != null
        ? new Date(n.timestamp as string | number)
        : new Date();
  const payload: AdminNotification = { ...n, timestamp: ts };
  listeners.forEach((l) => {
    try {
      l(payload);
    } catch (e) {
      console.warn("[admin-notifications-bus] listener error:", e);
    }
  });
}
