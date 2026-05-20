import { cn } from "@/lib/utils";

export function FieldError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p className={cn("text-xs text-destructive mt-1.5", className)} role="alert">
      {message}
    </p>
  );
}

export function inputWithError(hasError: boolean, className?: string): string {
  return cn(
    className,
    hasError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25",
  );
}
