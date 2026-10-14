"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUser } from "@/lib/hooks/useAuth";
import { useRentals } from "@/lib/hooks/useRentals";
import { useItems } from "@/lib/hooks/useItems";
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  getInitials,
} from "@/lib/utils/format";
import { getRentalStatusColor } from "@/lib/utils/status";
import { ROUTES } from "@/lib/utils/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Circle,
  Mail,
  Package,
  Phone,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Wallet,
} from "lucide-react";

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Package;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline bg-surface p-4 shadow-[var(--shadow-level-1)]">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-label-sm text-on-surface-variant">
          {label}
        </p>
        <p className="truncate text-title-md font-semibold text-on-surface">
          {value}
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline bg-surface p-5 shadow-[var(--shadow-level-1)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-body-lg font-semibold text-on-surface">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: userData, isLoading } = useUser();
  const { data: rentalsData } = useRentals({ limit: 50 });
  const { data: itemsData } = useItems({ mine: true, limit: 50 });

  const rentals = useMemo(() => rentalsData?.rentals ?? [], [rentalsData]);
  const ownedItems = useMemo(() => itemsData?.items ?? [], [itemsData]);

  const stats = useMemo(() => {
    const active = rentals.filter(
      (r) => r.status === "ACTIVE" || r.status === "CONFIRMED",
    ).length;
    const spent = rentals
      .filter((r) => r.status !== "CANCELLED")
      .reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);
    return { total: rentals.length, active, spent };
  }, [rentals]);

  if (isLoading && !user) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const profile = userData || user;

  if (!profile) {
    return (
      <p className="py-12 text-center text-body-md text-on-surface-variant">
        User not found
      </p>
    );
  }

  const checklist = [
    { label: "Full name added", done: Boolean(profile.fullName) },
    { label: "Email on file", done: Boolean(profile.email) },
    { label: "Phone number added", done: Boolean(profile.phone) },
    { label: "ID verified", done: profile.isIdVerified },
  ];
  const completion = Math.round(
    (checklist.filter((c) => c.done).length / checklist.length) * 100,
  );

  const recentRentals = rentals.slice(0, 3);
  const recentItems = ownedItems.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Identity */}
      <header className="flex flex-col gap-5 rounded-xl border border-outline bg-surface p-6 shadow-[var(--shadow-level-1)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          <Avatar className="h-20 w-20 shrink-0 border-2 border-primary-container/20">
            <AvatarFallback className="bg-primary-container/10 text-2xl text-primary-container">
              {getInitials(profile.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <h1 className="truncate text-h2 font-semibold text-on-surface">
              {profile.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-surface-container-high text-on-surface-variant"
              >
                {profile.role === "ADMIN" ? "Administrator" : "Student"}
              </Badge>
              {profile.isIdVerified ? (
                <Badge className="gap-1 border-success/30 bg-success/15 text-success">
                  <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                  Verified
                </Badge>
              ) : (
                <Badge className="gap-1 border-warning/30 bg-warning/15 text-warning">
                  <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                  Pending verification
                </Badge>
              )}
              {profile.createdAt && (
                <span className="text-label-sm text-on-surface-variant">
                  Member since {formatDate(profile.createdAt)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" aria-hidden="true" />
                {profile.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" aria-hidden="true" />
                {profile.phone || "No phone added"}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          render={
            <Link href={ROUTES.SETTINGS}>
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Edit profile
            </Link>
          }
          className="shrink-0 border-outline text-on-surface hover:bg-surface-container"
        />
      </header>

      {/* Activity at a glance */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Rentals made"
          value={String(stats.total)}
          icon={ShoppingBag}
        />
        <StatTile
          label="Active rentals"
          value={String(stats.active)}
          icon={Package}
        />
        <StatTile
          label="Items listed"
          value={String(ownedItems.length)}
          icon={Package}
        />
        <StatTile
          label="Total spent"
          value={formatCurrency(stats.spent)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <SectionCard
            title="Recent rentals"
            action={
              <Link
                href={ROUTES.DASHBOARD}
                className="inline-flex items-center gap-1 text-label-md font-medium text-primary hover:underline"
              >
                View all
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            {recentRentals.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                You haven&apos;t rented anything yet.{" "}
                <Link href={ROUTES.ITEMS} className="text-primary underline">
                  Browse items
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-outline/60">
                {recentRentals.map((rental) => (
                  <li key={rental.id}>
                    <Link
                      href={`/rentals/${rental.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:no-underline"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-body-md font-medium text-on-surface">
                          {rental.item?.name || "Unknown item"}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {formatDateRange(rental.startDate, rental.endDate)}
                        </p>
                      </div>
                      <Badge
                        className={`shrink-0 border text-label-sm ${getRentalStatusColor(rental.status)}`}
                      >
                        {rental.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Your listings"
            action={
              <Link
                href={ROUTES.CREATE_ITEM}
                className="inline-flex items-center gap-1 text-label-md font-medium text-primary hover:underline"
              >
                List an item
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            {recentItems.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                You haven&apos;t listed any items yet.
              </p>
            ) : (
              <ul className="divide-y divide-outline/60">
                {recentItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/items/${item.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:no-underline"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-body-md font-medium text-on-surface">
                          {item.name}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {item.category}
                        </p>
                      </div>
                      <span className="shrink-0 text-body-sm font-medium text-on-surface">
                        {formatCurrency(item.pricePerDay)}/day
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Profile completeness */}
        <aside>
          <SectionCard title="Profile strength">
            <div className="mb-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-title-md font-semibold text-on-surface">
                  {completion}%
                </span>
                <span className="text-label-sm text-on-surface-variant">
                  complete
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={completion}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completeness"
                className="h-2 overflow-hidden rounded-full bg-surface-container-high"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <ul className="space-y-2.5">
              {checklist.map((c) => (
                <li
                  key={c.label}
                  className="flex items-center gap-2.5 text-body-sm"
                >
                  {c.done ? (
                    <Check
                      className="h-4 w-4 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="h-4 w-4 text-on-surface-variant"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      c.done ? "text-on-surface" : "text-on-surface-variant"
                    }
                  >
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
            {completion < 100 && (
              <Link
                href={ROUTES.SETTINGS}
                className="mt-4 inline-flex items-center gap-1 text-label-md font-medium text-primary hover:underline"
              >
                Finish your profile
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
