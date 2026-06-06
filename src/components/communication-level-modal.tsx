import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModalCloseBar } from "@/components/modal-close-bar";
import {
  sheetModalClass,
  modalScrollPaneClass,
  modalFooterClass,
} from "@/components/product-modal-layout";
import { useState, useEffect } from "react";
import { whatsappService } from "@/lib/whatsapp-service";

type CustomerTier = "Standard" | "Bronze" | "Silver" | "Gold" | "Platinum";

interface CommunicationLevelModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone?: string;
  customerTier?: CustomerTier;
}

export function CommunicationLevelModal({
  isOpen,
  onOpenChange,
  orderNumber,
  status,
  customerName,
  customerPhone,
  customerTier = "Standard",
}: CommunicationLevelModalProps) {
  const [message, setMessage] = useState("");

  // Set tier-based message when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage(
        whatsappService.formatStatusUpdateMessage({
          customerName,
          orderNumber,
          status,
          tier: customerTier,
        }),
      );
    }
  }, [isOpen, orderNumber, status, customerName, customerTier]);

  const handleSendMessage = () => {
    if (!customerPhone) {
      console.error("Customer phone number is missing");
      return;
    }

    // Generate WhatsApp link using the centralized service
    const link = whatsappService.getWhatsAppLink(customerPhone, message);
    window.open(link, "_blank");

    onOpenChange(false);
    setMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={sheetModalClass}>
        <ModalCloseBar onClose={() => onOpenChange(false)} />
        <div className="shrink-0 border-b border-border bg-muted/30 p-4 sm:p-6">
          <h3 className="font-serif text-lg text-foreground sm:text-xl">Send WhatsApp Message</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Order #{orderNumber} - {status} • Tier: {customerTier || "Not set"}
          </p>
        </div>
        <div className={modalScrollPaneClass}>
          <div className="space-y-4 px-3 py-4 sm:px-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full min-h-[200px] rounded-lg border border-border bg-background p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your message will appear here..."
              />
            </div>
          </div>
        </div>
        <div className={modalFooterClass}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button onClick={handleSendMessage} className="rounded-full">
            Send via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
