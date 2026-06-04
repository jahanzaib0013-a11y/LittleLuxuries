import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UserPlus, Sparkles, AlertCircle, Phone, Mail, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createCustomer, CreateCustomerInput } from "@/lib/customers";
import { useQueryClient } from "@tanstack/react-query";
import { FieldError, inputWithError } from "@/components/field-error";
import {
  validateEmail,
  validateRequired,
  hasFieldErrors,
  type FieldErrors,
} from "@/lib/form-validation";
import {
  fullScreenModalClass,
  modalFooterClass,
  modalInputClass,
  modalSelectClass,
} from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { cn } from "@/lib/utils";

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCustomerModal({ open, onOpenChange }: AddCustomerModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<"first_name" | "last_name" | "email">
  >({});
  const [formData, setFormData] = useState<CreateCustomerInput>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    membership_tier: "Standard",
  });

  const handleSubmit = async () => {
    const errors: FieldErrors<"first_name" | "last_name" | "email"> = {
      first_name: validateRequired(formData.first_name, "First name"),
      last_name: validateRequired(formData.last_name, "Last name"),
      email: validateEmail(formData.email),
    };
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const { success, error } = await createCustomer(formData);
      if (success) {
        toast.success(`Client ${formData.first_name} ${formData.last_name} created successfully.`);
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          membership_tier: "Standard",
        });
        onOpenChange(false);
      } else {
        toast.error(error || "Failed to create customer");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while creating the customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-card border-none shadow-2xl p-0 rounded-[32px] overflow-hidden max-h-[95vh] flex flex-col">
        <DialogHeader className="p-6 sm:p-8 pb-4 shrink-0 bg-white relative z-10 border-b border-border/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-soft rounded-2xl flex items-center justify-center shrink-0">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl text-foreground sm:text-2xl">
                Add New Client
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create a premium profile to track lifetime value and order history.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fcfcfc] px-4 py-4 custom-scrollbar sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> First Name{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Eleanor"
                value={formData.first_name}
                onChange={(e) => {
                  setFormData({ ...formData, first_name: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, first_name: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.first_name)}
                className={inputWithError(
                  Boolean(fieldErrors.first_name),
                  cn(modalInputClass, "bg-white border border-border focus-visible:ring-primary/20"),
                )}
              />
              <FieldError message={fieldErrors.first_name} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Vance"
                value={formData.last_name}
                onChange={(e) => {
                  setFormData({ ...formData, last_name: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, last_name: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.last_name)}
                className={inputWithError(
                  Boolean(fieldErrors.last_name),
                  cn(modalInputClass, "bg-white border border-border focus-visible:ring-primary/20"),
                )}
              />
              <FieldError message={fieldErrors.last_name} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Email Address{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="eleanor.v@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                className={inputWithError(
                  Boolean(fieldErrors.email),
                  cn(modalInputClass, "bg-white border border-border focus-visible:ring-primary/20"),
                )}
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </Label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={cn(modalInputClass, "bg-white border border-border focus-visible:ring-primary/20")}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-(--color-gold-foreground)" /> Initial Tier
              </Label>
              <Select
                value={formData.membership_tier}
                onValueChange={(val: any) => setFormData({ ...formData, membership_tier: val })}
              >
                <SelectTrigger className={cn(modalSelectClass, "bg-white border border-border")}>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-8 bg-primary-soft/30 border border-primary/10 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-foreground/80 leading-relaxed">
              New clients are automatically welcomed via the Boutique email system if you have
              onboarding emails enabled in settings. Their tier will naturally upgrade as they place
              more orders.
            </div>
          </div>
        </div>

        <div className={cn(modalFooterClass, "flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3")}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-11 w-full rounded-full border-border text-base font-semibold sm:w-auto sm:px-8"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="min-h-11 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-md sm:w-auto sm:px-10"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              "Create Profile"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
