import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { confirmModalClass, sheetModalInnerClass } from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";

interface CustomerDeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function CustomerDeleteConfirmationModal({
  open,
  onOpenChange,
  customerName,
  onConfirm,
  isDeleting = false,
}: CustomerDeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={confirmModalClass + " bg-white"}>
        <ModalCloseBar onClose={() => onOpenChange(false)} label="Cancel" />
        <div className={sheetModalInnerClass}>
          <DialogHeader className="pb-0">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <DialogTitle className="font-serif text-lg text-foreground">
                  Delete Client Profile
                </DialogTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="rounded-2xl border border-destructive/10 bg-destructive/5 p-5">
              <p className="text-xs leading-relaxed text-foreground/80">
                Are you sure you want to delete{" "}
                <span className="font-bold text-destructive">"{customerName}"</span>? This will
                permanently remove their premium client profile, lifetime statistics, and billing
                records from the Boutique Command Center.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
                className="min-h-11 flex-1 rounded-full text-base font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isDeleting}
                className="min-h-11 flex-1 rounded-full text-base font-semibold shadow-lg"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Client</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
