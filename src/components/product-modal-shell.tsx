import { useState, type ReactNode } from "react";
import { ImageIcon, ListChecks, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileTab = "colors" | "details";

type ProductModalShellProps = {
  colorsPane: ReactNode;
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  onClose?: () => void;
};

export function ProductModalShell({ colorsPane, header, children, footer, onClose }: ProductModalShellProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("colors");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden touch-manipulation">
      {onClose ? (
        <div className="flex shrink-0 items-center justify-end border-b border-border/40 bg-white px-2 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-3 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground active:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
            Close
          </button>
        </div>
      ) : null}

      {/* Mobile: one screen at a time */}
      <div
        className="grid shrink-0 grid-cols-2 gap-1.5 border-b border-border/60 bg-white p-2 sm:p-2.5 lg:hidden"
        role="tablist"
        aria-label="Product form sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "colors"}
          onClick={() => setMobileTab("colors")}
          className={cn(
            "flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors",
            mobileTab === "colors"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <ImageIcon className="h-4 w-4 shrink-0" />
          Colors
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "details"}
          onClick={() => setMobileTab("details")}
          className={cn(
            "flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors",
            mobileTab === "details"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <ListChecks className="h-4 w-4 shrink-0" />
          Details
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-col",
            "max-lg:flex-1 max-lg:w-full",
            mobileTab !== "colors" && "max-lg:hidden",
            "lg:flex lg:w-[min(100%,380px)] lg:shrink-0 lg:border-r lg:border-border/50 lg:max-h-none",
          )}
        >
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-muted/20 p-3 sm:p-4 lg:p-6 xl:p-8">
            {colorsPane}
          </div>
          {onClose ? (
            <div className="shrink-0 border-t border-border/40 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 w-full rounded-full border border-border/60 bg-muted/30 text-base font-semibold text-foreground active:bg-muted"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white",
            mobileTab !== "details" && "max-lg:hidden",
            "lg:flex",
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-8 lg:pt-8 lg:pb-4">
            <div className="min-w-0 flex-1">{header}</div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted lg:grid"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-3 sm:px-4 sm:pb-4 lg:px-8 lg:pt-2 lg:pb-4 custom-scrollbar">
            {children}
          </div>
          <div className="shrink-0">{footer}</div>
        </div>
      </div>
    </div>
  );
}
