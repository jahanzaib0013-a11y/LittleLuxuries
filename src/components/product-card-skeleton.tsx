import { Skeleton } from "@/components/ui/skeleton";

/** Shimmer placeholder matching the storefront product card layout. */
export function ProductCardSkeleton() {
  return (
    <div className="min-w-0 max-w-full">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="mt-2 h-3 w-1/3" />
    </div>
  );
}

/** A responsive grid of product skeletons for loading states. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
