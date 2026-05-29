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
import { FieldError, inputWithError } from "@/components/field-error";
import { validateRequired, hasFieldErrors, type FieldErrors } from "@/lib/form-validation";
import { Mail, Send, Sparkles } from "lucide-react";
import {
  sheetModalClass,
  sheetModalInnerClass,
  modalFooterClass,
  modalInputClass,
  modalTextareaClass,
} from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { cn } from "@/lib/utils";

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function SendMessageModal({ open, onOpenChange, customer }: SendMessageModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"subject" | "message">>({});

  const handleSend = async () => {
    const errors: FieldErrors<"subject" | "message"> = {
      subject: validateRequired(subject, "Subject"),
      message: validateRequired(message, "Message"),
    };
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSending(true);
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
      <DialogContent className={sheetModalClass}>
        <ModalCloseBar onClose={() => onOpenChange(false)} />
        <div className={sheetModalInnerClass}>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <DialogTitle className="font-serif text-xl">Direct Message</DialogTitle>
            </div>
            <div className="text-sm italic text-muted-foreground">
              To: {customer?.customer_name} ({customer?.email})
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Subject
              </label>
              <Input
                placeholder="Enter message subject..."
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, subject: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.subject)}
                className={inputWithError(
                  Boolean(fieldErrors.subject),
                  cn(modalInputClass, "border border-border bg-muted/30"),
                )}
              />
              <FieldError message={fieldErrors.subject} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Message
                </label>
                <button
                  type="button"
                  onClick={handleAISuggest}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-opacity hover:opacity-70"
                >
                  <Sparkles className="h-3 w-3" /> Suggest with AI
                </button>
              </div>
              <Textarea
                placeholder="Type your personal message here..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, message: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.message)}
                className={inputWithError(
                  Boolean(fieldErrors.message),
                  cn(modalTextareaClass, "border border-border bg-muted/30"),
                )}
              />
              <FieldError message={fieldErrors.message} />
            </div>
          </div>

          <DialogFooter className={cn(modalFooterClass, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}>
            <div className="text-center text-[10px] italic text-muted-foreground sm:text-left">
              Messages are sent via the email server.
            </div>
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="min-h-11 w-full rounded-full px-8 text-base font-semibold sm:w-auto"
            >
              {isSending ? (
                "Sending..."
              ) : (
                <>
                  Send Message <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
