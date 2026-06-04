import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Customer } from "@/lib/customers";
import { orderService, Order } from "@/lib/order-service";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Calendar, DollarSign, User, Phone, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/format-currency";
import { sheetModalClass, sheetModalInnerClass } from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { cn } from "@/lib/utils";

interface ViewCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function ViewCustomerModal({ open, onOpenChange, customer }: ViewCustomerModalProps) {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["customer-orders", customer?.id],
    queryFn: () => (customer ? orderService.getCustomerOrders(customer.id) : null),
    enabled: !!customer && open,
  });

  const orders = ordersData?.orders || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sheetModalClass, "sm:max-w-2xl")}>
        <ModalCloseBar onClose={() => onOpenChange(false)} />
        <div className={sheetModalInnerClass}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl sm:text-2xl">Customer Profile</DialogTitle>
          </DialogHeader>

          {customer && (
            <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Loyalty Tier</span>
                </div>
                <div className="font-medium text-primary">{customer.membership_tier}</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Total Spent</span>
                </div>
                <div className="font-medium">{customer.total_spent}</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Total Orders</span>
                </div>
                <div className="font-medium">{customer.total_orders}</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Contact Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Full Name
                  </div>
                  <div className="text-sm">{customer.customer_name}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Email Address
                  </div>
                  <div className="text-sm">{customer.email}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Join Date
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {customer.join_date}
                  </div>
                </div>
                {customer.phone && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Phone Number
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {customer.phone}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-wrap gap-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-9 text-xs"
                  onClick={() => window.open(`mailto:${customer.email}`, "_self")}
                >
                  <Mail className="h-3.5 w-3.5 mr-2" /> Email
                </Button>
                {customer.phone && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-9 text-xs"
                      onClick={() => window.open(`tel:${customer.phone}`, "_self")}
                    >
                      <Phone className="h-3.5 w-3.5 mr-2" /> Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-9 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => {
                        const phone = customer.phone as string;
                        const message = encodeURIComponent(
                          `Hello ${customer.customer_name}, this is from Little Luxuries regarding your account.`,
                        );
                        window.open(
                          `https://api.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, "")}&text=${message}`,
                          "_blank",
                        );
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-2" /> WhatsApp
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Order History */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Recent Order History</h4>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    No orders found for this customer.
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Order #</th>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-primary">
                            {order.order_number}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 capitalize">{order.status.replace("_", " ")}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatPkr(Number(order.total_amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
