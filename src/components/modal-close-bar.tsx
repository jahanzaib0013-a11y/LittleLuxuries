import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalCloseBarProps = {
  onClose: () => void;
  label?: string;
  className?: string;
  /** Show on tablet+ as well (default: mobile only) */
  showOnDesktop?: boolean;
};

export function ModalCloseBar({
  onClose,
  label = "Close",
  className,
  showOnDesktop = false,
}: ModalCloseBarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end border-b border-border/40 bg-white px-2 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-3",
        !showOnDesktop && "lg:hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClose}
        className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground active:bg-muted"
        aria-label={label}
      >
        <X className="h-5 w-5" />
        {label}
      </button>
    </div>
  );
}
