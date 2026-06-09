import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModalCloseBar } from "@/components/modal-close-bar";
import {
  sheetModalClass,
  modalScrollPaneClass,
  modalFooterClass,
} from "@/components/product-modal-layout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { OrderWithItems } from "@/lib/order-service";
import { orderService } from "@/lib/order-service";
import { whatsappService, normalizeTier } from "@/lib/whatsapp-service";
import {
  EMAIL_TEMPLATES,
  getEmailTemplate,
  pickDefaultTemplateForStatus,
  type EmailWriterContext,
} from "@/lib/email-writer-templates";

type WhatsAppWriterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems | null;
};

const tierChipClass: Record<string, string> = {
  Standard: "bg-muted text-muted-foreground",
  Bronze: "bg-amber-100 text-amber-800",
  Silver: "bg-slate-200 text-slate-700",
  Gold: "bg-yellow-100 text-yellow-800",
  Platinum: "bg-violet-100 text-violet-700",
};

export function WhatsAppWriterModal({ open, onOpenChange, order }: WhatsAppWriterModalProps) {
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");

  const tier = normalizeTier(order?.customer_tier);

  const ctx: EmailWriterContext | null = useMemo(() => {
    if (!order) return null;
    return {
      customerName: `${order.customer_first_name} ${order.customer_last_name}`.trim(),
      orderNumber: order.order_number,
      status: order.status,
      trackingNumber: order.tracking_number,
      tier: order.customer_tier,
    };
  }, [order]);

  const applyTemplate = (id: string) => {
    if (!ctx) return;
    const tpl = getEmailTemplate(id);
    if (!tpl) return;
    setSelectedId(id);
    setMessage(tpl.build(ctx).body);
  };

  useEffect(() => {
    if (open && ctx) {
      const id = pickDefaultTemplateForStatus(ctx.status);
      const tpl = getEmailTemplate(id);
      if (tpl) {
        setSelectedId(id);
        setMessage(tpl.build(ctx).body);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id]);

  const handleSend = () => {
    if (!order) return;
    if (!order.customer_phone) {
      toast.error("No phone number on file for this customer.");
      return;
    }
    if (!message.trim()) {
      toast.error("Write a message before sending.");
      return;
    }
    window.open(whatsappService.getWhatsAppLink(order.customer_phone, message), "_blank");
    // Record that WhatsApp was sent (best-effort).
    void orderService.recordWhatsAppSent(order.id).catch(() => {});
    onOpenChange(false);
  };

  if (!order) return null;

  const statusTemplates = EMAIL_TEMPLATES.filter((t) => t.category === "Status");
  const generalTemplates = EMAIL_TEMPLATES.filter((t) => t.category === "General");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sheetModalClass}>
        <ModalCloseBar onClose={() => onOpenChange(false)} />
        <div className="shrink-0 border-b border-border bg-muted/30 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg text-foreground sm:text-xl">
                WhatsApp {order.customer_first_name}
              </h3>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Order #{order.order_number}</span>
                <span>·</span>
                <span className="truncate">{order.customer_phone || "no phone"}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    tierChipClass[tier],
                  )}
                >
                  {tier}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className={modalScrollPaneClass}>
          <div className="space-y-5 px-3 py-4 sm:px-6">
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60">
                Templates — click to auto-fill ({tier} tone)
              </p>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Order status
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusTemplates.map((t) => (
                    <TemplateChip
                      key={t.id}
                      label={t.label}
                      active={selectedId === t.id}
                      onClick={() => applyTemplate(t.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  General
                </p>
                <div className="flex flex-wrap gap-2">
                  {generalTemplates.map((t) => (
                    <TemplateChip
                      key={t.id}
                      label={t.label}
                      active={selectedId === t.id}
                      onClick={() => applyTemplate(t.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[220px] w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Your message…"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Opens WhatsApp with this message pre-filled, ready to send.
              </p>
            </div>
          </div>
        </div>

        <div className={modalFooterClass}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Send className="mr-1.5 h-4 w-4" />
            Send via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-border bg-card text-foreground hover:border-emerald-400 hover:bg-emerald-50",
      )}
    >
      {label}
    </button>
  );
}
