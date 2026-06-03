import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Customer } from "@/lib/customers";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Send, Sparkles } from "lucide-react";

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function SendMessageModal({ open, onOpenChange, customer }: SendMessageModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message || !subject) {
      toast.error("Please fill in both subject and message");
      return;
    }

    setIsSending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success(`Message sent to ${customer?.customer_name}!`);
    setIsSending(false);
    onOpenChange(false);
    setSubject("");
    setMessage("");
  };

  const handleAISuggest = () => {
    if (!customer) return;
    const suggestions = [
      `Hi ${customer.customer_name.split(" ")[0]}, thank you for your recent orders! We've noticed you're a ${customer.membership_tier} member and wanted to share a special 15% discount for your next purchase: LUXE15`,
      `Dear ${customer.customer_name.split(" ")[0]}, we noticed you haven't visited us in a while. As a valued ${customer.membership_tier} member, we'd love to welcome you back with free shipping on your next order!`,
      `Hi ${customer.customer_name.split(" ")[0]}, your recent order has been delivered! We hope you love your new Little Luxuries items. Would you like to leave a review?`,
    ];
    setMessage(suggestions[Math.floor(Math.random() * suggestions.length)]);
    setSubject(
      customer.membership_tier === "Gold"
        ? "Exclusive Gift for our Gold Member"
        : "A Special Note from Little Luxuries",
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary-soft grid place-items-center text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <DialogTitle className="font-serif text-xl">Direct Message</DialogTitle>
          </div>
          <div className="text-sm text-muted-foreground italic">
            To: {customer?.customer_name} ({customer?.email})
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Subject
            </label>
            <Input
              placeholder="Enter message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl bg-muted/30 border-border"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Message
              </label>
              <button
                onClick={handleAISuggest}
                className="text-[10px] uppercase tracking-wider text-primary font-bold flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <Sparkles className="h-3 w-3" /> Suggest with AI
              </button>
            </div>
            <Textarea
              placeholder="Type your personal message here..."
              className="min-h-[150px] rounded-2xl bg-muted/30 border-border resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-3">
          <div className="text-[10px] text-muted-foreground italic">
            Messages are sent via the email server.
          </div>
          <Button onClick={handleSend} disabled={isSending} className="rounded-full px-8 h-11">
            {isSending ? (
              "Sending..."
            ) : (
              <>
                Send Message <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
