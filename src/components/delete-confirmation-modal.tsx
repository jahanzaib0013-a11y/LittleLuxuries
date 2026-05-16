import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  productName,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-0 shadow-2xl">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl font-serif text-foreground">
                Delete Product
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">This action cannot be undone</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pb-6">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            <p className="text-sm text-foreground leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-destructive">"{productName}"</span>? This will
              permanently remove the product from your inventory and cannot be recovered.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="flex-1 rounded-full border-primary/30 hover:border-primary/50 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 rounded-full bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/95 hover:to-destructive/85 transition-all duration-300 shadow-lg"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </div>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Delete Product
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
