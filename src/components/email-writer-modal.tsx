import { useEffect, useMemo, useState } from "react";
import { Mail, Send } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalCloseBar } from "@/components/modal-close-bar";
import {
  sheetModalClass,
  modalScrollPaneClass,
  modalFooterClass,
} from "@/components/product-modal-layout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { OrderWithItems } from "@/lib/order-service";
import { sendCustomEmail } from "@/lib/email.server";
import { normalizeTier } from "@/lib/whatsapp-service";
import {
  EMAIL_TEMPLATES,
  getEmailTemplate,
  pickDefaultTemplateForStatus,
  type EmailWriterContext,
} from "@/lib/email-writer-templates";

type EmailWriterModalProps = {
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

export function EmailWriterModal({ open, onOpenChange, order }: EmailWriterModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

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
    const { subject: s, body: b } = tpl.build(ctx);
    setSelectedId(id);
    setSubject(s);
    setBody(b);
  };

  // Auto-select the template matching the order's status when opened.
  useEffect(() => {
    if (open && ctx) {
      const id = pickDefaultTemplateForStatus(ctx.status);
      const tpl = getEmailTemplate(id);
      if (tpl) {
        const { subject: s, body: b } = tpl.build(ctx);
        setSelectedId(id);
        setSubject(s);
        setBody(b);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id]);

  const handleSend = async () => {
    if (!order) return;
    if (!order.customer_email) {
      toast.error("No email address on file for this customer.");
      return;
    }
    if (!body.trim()) {
      toast.error("Write a message before sending.");
      return;
    }
    setIsSending(true);
    try {
      const send = sendCustomEmail as unknown as (p: {
        data: { to: string; subject: string; body: string };
      }) => Promise<{ success: boolean }>;
      await send({
        data: {
          to: order.customer_email,
          subject: subject.trim() || "A note from Little Luxuries",
          body,
        },
      });
      toast.success(`Email sent to ${order.customer_email}`);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to send email:", err);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
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
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary">
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg text-foreground sm:text-xl">
                Email {order.customer_first_name}
              </h3>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Order #{order.order_number}</span>
                <span>·</span>
                <span className="truncate">{order.customer_email}</span>
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
            {/* Templates */}
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

            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="h-11 rounded-xl"
              />
            </div>

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[220px] w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Your message…"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Sent as a branded Little Luxuries email with your logo and styling.
              </p>
            </div>
          </div>
        </div>

        <div className={modalFooterClass}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="rounded-full">
            <Send className="mr-1.5 h-4 w-4" />
            {isSending ? "Sending…" : "Send Email"}
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
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary-soft/30",
      )}
    >
      {label}
    </button>
  );
}
