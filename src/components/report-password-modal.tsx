import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Download, AlertCircle } from "lucide-react";
import { FieldError } from "@/components/field-error";
import { validateRequired } from "@/lib/form-validation";
import { sheetModalClass, sheetModalInnerClass } from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { cn } from "@/lib/utils";

interface ReportPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportName: string;
  onPasswordSubmit: (password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function ReportPasswordModal({
  isOpen,
  onClose,
  reportName,
  onPasswordSubmit,
  isLoading = false,
  error,
}: ReportPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateRequired(password, "Password");
    if (err) {
      setPasswordError(err);
      return;
    }
    setPasswordError(undefined);
    onPasswordSubmit(password);
  };

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={sheetModalClass}>
        <ModalCloseBar onClose={handleClose} />
        <div className={sheetModalInnerClass}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground text-center px-4 mb-3">
              This document is password-protected. Please enter a password.
            </p>
            <p className="text-xs text-primary font-medium bg-primary/5 px-2 py-1 rounded-md">
              💡 Hint: The default password is <code>report123</code>
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-password">Report Password</Label>
              <PasswordInput
                id="report-password"
                showLockIcon={false}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(undefined);
                }}
                disabled={isLoading}
                autoComplete="off"
              />
              <FieldError message={passwordError} />
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="min-h-11 flex-1 rounded-full text-base font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!password.trim() || isLoading}
                className="min-h-11 flex-1 rounded-full text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-pulse" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="text-xs text-muted-foreground border-t pt-3">
            <p className="font-medium">Security Notice:</p>
            <p>
              This report contains sensitive business data and is protected for authorized users
              only.
            </p>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
