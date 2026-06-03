import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

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
      <DialogContent className="max-w-md bg-white border-none shadow-2xl p-0 rounded-[32px] overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-destructive animate-bounce" />
            </div>
            <div>
              <DialogTitle className="text-lg font-serif text-foreground">
                Delete Client Profile
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-5">
            <p className="text-xs text-foreground/80 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-destructive">"{customerName}"</span>? This will
              permanently remove their premium client profile, lifetime statistics, and billing
              records from the Boutique Command Center.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="flex-1 rounded-full h-11 border-border text-xs font-bold transition-all"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 rounded-full h-11 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold shadow-xl shadow-destructive/10 transition-all active:scale-95"
            >
              {isDeleting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
      </DialogContent>
    </Dialog>
  );
}
