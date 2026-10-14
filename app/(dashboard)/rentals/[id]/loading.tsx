import { Skeleton } from "@/components/ui/skeleton";

export default function RentalDetailLoading() {
  return (
    <div
      className="mx-auto max-w-4xl space-y-6"
      role="status"
      aria-label="Loading rental"
    >
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
