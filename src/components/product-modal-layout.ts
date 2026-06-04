/** Shared layout classes for modals (ultra mobile-first). */

/** Full-screen on mobile; centered panel from sm+ (product add/edit, large forms) */
export const fullScreenModalClass =
  "fixed z-50 !flex w-full max-w-[100dvw] flex-col gap-0 border-0 bg-white p-0 shadow-2xl " +
  "inset-x-0 top-0 left-0 min-h-0 h-[100dvh] max-h-[100dvh] w-[100dvw] translate-x-0 translate-y-0 rounded-none overflow-hidden " +
  "touch-manipulation " +
  "max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom " +
  "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[95dvh] sm:max-w-[95vw] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[28px] " +
  "lg:max-w-5xl lg:h-[90vh] lg:rounded-[40px]";

/** Wider desktop max-width for view/share modals */
export const fullScreenModalWideClass = fullScreenModalClass.replace(
  "lg:max-w-5xl",
  "lg:max-w-6xl",
);

/** Bottom sheet on mobile; centered dialog from sm+ */
export const sheetModalClass =
  "fixed z-50 !flex w-[100dvw] max-w-[100dvw] min-h-0 flex-col gap-0 border-0 bg-white p-0 shadow-2xl " +
  "inset-x-0 bottom-0 top-auto left-0 h-auto max-h-[92dvh] translate-x-0 translate-y-0 rounded-t-[20px] overflow-hidden touch-manipulation " +
  "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:w-[calc(100vw-1rem)] sm:max-w-lg sm:max-h-[95dvh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl";

export const sheetModalInnerClass = "overflow-y-auto overscroll-contain p-3 sm:p-6";

/** Small confirmations */
export const confirmModalClass = sheetModalClass.replace("sm:max-w-lg", "sm:max-w-md");

export const modalFooterClass =
  "border-t border-border/40 bg-white/95 px-3 py-3 backdrop-blur-md " +
  "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:py-4";

export const modalInputClass =
  "h-11 rounded-xl border-none bg-muted/30 text-base focus:ring-2 focus:ring-primary/20 sm:h-12 sm:rounded-2xl";

export const modalLabelClass =
  "text-[10px] font-bold uppercase tracking-[0.15em] text-primary/60 sm:text-[11px] sm:tracking-[0.2em]";

export const modalSelectClass =
  "h-11 w-full rounded-xl border-none bg-muted/30 text-base focus:ring-2 focus:ring-primary/20 sm:h-12 sm:rounded-2xl";

export const modalTextareaClass =
  "min-h-[100px] resize-none rounded-xl border-none bg-white p-4 text-base focus:ring-2 focus:ring-primary/20 sm:min-h-[120px] sm:rounded-2xl sm:p-5";

/** Scrollable region inside full-screen / sheet modals (required min-h-0 for iOS) */
export const modalScrollPaneClass =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]";

export const productModalContentClass = fullScreenModalClass;
/** @deprecated Use ProductModalShell instead */
export const productModalBodyClass =
  "flex min-h-0 flex-1 w-full flex-col overflow-hidden lg:flex-row";

/** @deprecated Use ProductModalShell instead */
export const productModalColorsPaneClass =
  "w-full shrink-0 overflow-y-auto overscroll-contain border-border/50 bg-muted/20 " +
  "max-h-[min(48dvh,28rem)] border-b p-3 sm:max-h-[min(52dvh,32rem)] sm:p-4 " +
  "lg:max-h-none lg:w-[400px] lg:border-b-0 lg:border-r lg:p-8";

export const productModalFormPaneClass =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white";

export const productModalHeaderClass = "shrink-0";

export const productModalScrollClass = "min-h-0 flex-1";

export const productModalFooterClass =
  "border-t border-border/40 bg-white/95 px-3 py-3 backdrop-blur-md " +
  "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 " +
  "sm:px-4 sm:py-4 sm:bg-muted/5 lg:px-8 lg:py-6";

export const nestedModalContentClass = sheetModalClass;
export const nestedModalInnerClass = sheetModalInnerClass + " lg:p-8";

export const productModalInputClass = modalInputClass + " lg:h-14";
export const productModalLabelClass = modalLabelClass;
export const productModalSelectClass = modalSelectClass + " lg:h-14";
export const productModalTextareaClass = modalTextareaClass;
