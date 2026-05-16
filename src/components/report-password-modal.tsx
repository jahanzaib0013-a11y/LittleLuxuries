import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Download, AlertCircle } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onPasswordSubmit(password);
    }
  };

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password Protected Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              The report <span className="font-medium">{reportName}</span> is password protected.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Enter the password to download and view this report.
            </p>
            <p className="text-xs text-primary mt-2 font-medium">
              💡 Hint: The default password is{" "}
              <code className="bg-muted px-1 py-0.5 rounded">report123</code>
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
              <Input
                id="report-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!password.trim() || isLoading} className="flex-1">
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
      </DialogContent>
    </Dialog>
  );
}
