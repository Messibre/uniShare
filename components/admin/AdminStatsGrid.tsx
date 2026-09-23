import { Users, Boxes, Receipt, Clock, Building2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStats {
  totalUsers: number;
  totalRentals: number;
  totalItems: number;
  pendingRentals: number;
  platformItems: number;
}

interface AdminStatsGridProps {
  stats?: AdminStats;
  isLoading: boolean;
}

export function AdminStatsGrid({ stats, isLoading }: AdminStatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Total users"
        value={String(stats?.totalUsers ?? 0)}
        icon={Users}
      />
      <StatCard
        label="Total items"
        value={String(stats?.totalItems ?? 0)}
        icon={Boxes}
      />
      <StatCard
        label="Total rentals"
        value={String(stats?.totalRentals ?? 0)}
        icon={Receipt}
      />
      <StatCard
        label="Pending rentals"
        value={String(stats?.pendingRentals ?? 0)}
        hint={stats?.pendingRentals ? "Awaiting confirmation" : "All clear"}
        icon={Clock}
        accent={Boolean(stats?.pendingRentals)}
      />
      <StatCard
        label="Platform items"
        value={String(stats?.platformItems ?? 0)}
        hint="Owned by uniShare"
        icon={Building2}
      />
    </div>
  );
}
