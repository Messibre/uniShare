import { Skeleton } from "@/components/ui/skeleton";

export default function ItemDetailLoading() {
  return (
    <div
      className="grid grid-cols-1 gap-6 lg:h-[calc(100dvh-15rem)] lg:min-h-[28rem] lg:grid-cols-2"
      role="status"
      aria-label="Loading item"
    >
      <Skeleton className="h-64 w-full rounded-xl lg:h-full" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
