import { Skeleton } from "@/components/ui/skeleton";

export default function ItemsLoading() {
  return (
    <div className="space-y-6">
      {/* Search & filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-[180px] rounded-md" />
      </div>
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-outline-variant rounded-xl overflow-hidden"
          >
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
