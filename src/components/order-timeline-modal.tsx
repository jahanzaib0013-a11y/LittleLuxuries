import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Package,
  Truck,
  Home,
  CreditCard,
  Clock,
  ShoppingBag,
  Star,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  orderService,
  type OrderWithItems,
  type OrderStatusHistoryItem,
} from "@/lib/order-service";
import { EmailWriterModal } from "@/components/email-writer-modal";
import { WhatsAppWriterModal } from "@/components/whatsapp-writer-modal";
import { toast } from "sonner";
import { sheetModalClass, modalScrollPaneClass } from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";

interface OrderTimelineModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems | null;
}

export function OrderTimelineModal({ isOpen, onOpenChange, order }: OrderTimelineModalProps) {
  const [history, setHistory] = React.useState<OrderStatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEmailWriterOpen, setIsEmailWriterOpen] = React.useState(false);
  const [isWhatsAppWriterOpen, setIsWhatsAppWriterOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && order?.id) {
      const fetchHistory = async () => {
        setIsLoading(true);
        const data = await orderService.getOrderStatusHistory(order.id);
        setHistory(data);
        setIsLoading(false);
      };
      fetchHistory();
    }
  }, [isOpen, order?.id]);

  if (!order) return null;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      order_placed: "Order Placed",
      order_confirmed: "Order Confirmed",
      payment_confirmed: "Payment Confirmed",
      packed: "Hand-Packed",
      shipped: "Boutique Shipped",
      delivered: "Delivered",
      pending_payment: "Payment Pending",
      paid: "Payment Verified",
      cancelled: "Order Cancelled",
    };
    return labels[status] || status.replace("_", " ");
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      order_placed: ShoppingBag,
      order_confirmed: MessageSquare,
      payment_confirmed: CheckCircle2,
      packed: Package,
      shipped: Truck,
      delivered: Home,
      pending_payment: Clock,
      paid: CreditCard,
      cancelled: Star,
    };
    return icons[status] || Package;
  };

  const getStatusDescription = (status: string, notes?: string) => {
    if (notes) return notes;
    const descriptions: Record<string, string> = {
      order_placed: "Initial order request received.",
      order_confirmed: "Customer confirmed order via WhatsApp.",
      payment_confirmed: "Payment has been verified and confirmed.",
      packed: "Items curated and placed in luxury packaging.",
      shipped: "Package handed to our priority courier.",
      delivered: "Hand-delivered to the customer.",
      pending_payment: "Waiting for payment verification or COD collection.",
      paid: "Transaction successfully processed.",
      cancelled: "The order has been cancelled.",
    };
    return descriptions[status] || "Status updated.";
  };

  // Determine current progress
  const statusOrder = [
    "order_placed",
    "order_confirmed",
    "payment_confirmed",
    "pending_payment",
    "packed",
    "shipped",
    "delivered",
  ];
  const currentStatusIndex = statusOrder.indexOf(order.status);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={cn(sheetModalClass, "min-h-0 sm:max-w-[480px]")}>
          <ModalCloseBar onClose={() => onOpenChange(false)} />
          <DialogHeader className="shrink-0 bg-linear-to-br from-gold/10 to-transparent p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">
                  Fulfillment Journey
                </div>
                <DialogTitle className="font-serif text-2xl text-foreground">
                  Order {order.order_number}
                </DialogTitle>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <Star className="h-6 w-6 text-(--color-gold-foreground) fill-current" />
              </div>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Real-time tracking for {order.customer_first_name}'s luxury selection.
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              modalScrollPaneClass,
              "space-y-6 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:space-y-8 sm:px-6",
            )}
          >
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-muted" />

              <div className="space-y-10 relative z-10">
                {isLoading ? (
                  <div className="flex flex-col gap-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-6 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : history.length > 0 ? (
                  history.map((h, i) => {
                    const Icon = getStatusIcon(h.status);
                    return (
                      <div
                        key={h.id}
                        className="flex gap-6 items-start transition-all duration-500"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary border-primary text-white flex items-center justify-center shrink-0 shadow-sm border-2">
                          {i < history.length - 1 ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>

                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-foreground">
                              {getStatusLabel(h.status)}
                            </h4>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {new Date(h.created_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              ·{" "}
                              {new Date(h.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {getStatusDescription(h.status, h.notes)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No history available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4">
                Reach Out & Confirm
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setIsWhatsAppWriterOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition text-xs font-bold border border-emerald-200/50"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send WhatsApp
                </button>
                <button
                  onClick={() => setIsEmailWriterOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 transition text-xs font-bold border border-primary/20"
                >
                  <Mail className="h-4 w-4" />
                  Write Email
                </button>
              </div>

              <div className="bg-muted/30 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">Estimated Delivery:</span>
                    <span className="block font-bold text-foreground">Tomorrow, 2:00 PM</span>
                  </div>
                </div>
                <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                  Contact Courier
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <EmailWriterModal
        open={isEmailWriterOpen}
        onOpenChange={setIsEmailWriterOpen}
        order={order}
      />
      <WhatsAppWriterModal
        open={isWhatsAppWriterOpen}
        onOpenChange={setIsWhatsAppWriterOpen}
        order={order}
      />
    </>
  );
}
