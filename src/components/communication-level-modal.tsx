import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { sheetModalClass, modalScrollPaneClass, modalFooterClass } from "@/components/product-modal-layout";
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

const getTierBasedMessage = (
  customerName: string,
  orderNumber: string,
  status: string,
  tier: string = "Standard",
): string => {
  const baseMessage = `Dear ${customerName},\n\nYour order #${orderNumber} status has been updated to "${status}".`;

  // Normalize tier name to handle variations like "Silver Member" vs "Silver"
  const normalizedTier = tier.toLowerCase().replace(" member", "").trim();

  const tierMessages: Record<string, string> = {
    standard: `${baseMessage}\n\nThank you for your patience and understanding.\n\nBest regards,\nLittle Luxuries Team`,
    bronze: `${baseMessage}\n\nWe appreciate your continued support and are committed to providing you with excellent service.\n\nWarm regards,\nLittle Luxuries Team`,
    silver: `${baseMessage}\n\nAs a valued Silver tier customer, we prioritize your satisfaction and are here to assist you with any needs.\n\nSincerely,\nLittle Luxuries Team`,
    gold: `${baseMessage}\n\nAs a distinguished Gold tier customer, we are dedicated to providing you with premium service and exclusive attention to your needs.\n\nWith highest regards,\nLittle Luxuries Team`,
    platinum: `${baseMessage}\n\nAs our esteemed Platinum tier customer, you receive our highest level of personalized service and priority support. We are committed to exceeding your expectations.\n\nWith deepest appreciation,\nLittle Luxuries Team`,
  };

  return tierMessages[normalizedTier] || tierMessages.standard;
};

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
      const tierMessage = getTierBasedMessage(
        customerName,
        orderNumber,
        status,
        customerTier,
      );
      setMessage(tierMessage);
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
              <label className="text-sm font-medium text-foreground mb-2 block">
                Message
              </label>
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
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
