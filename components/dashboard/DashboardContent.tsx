"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  PlusCircle,
  Package,
  Wallet,
  Clock,
  ShoppingBag,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRentals } from "@/lib/hooks/useRentals";
import { useItems } from "@/lib/hooks/useItems";
import { formatCurrency, getInitials } from "@/lib/utils/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/utils/constants";
import { StatCard } from "./StatCard";
import { RentalCard } from "./RentalCard";
import { OwnedItemCard } from "./OwnedItemCard";

export function DashboardContent() {
  const { user } = useAuthStore();
  const { data: rentalsData } = useRentals({ limit: 20 });
  const { data: itemsData } = useItems({ mine: true, limit: 50 });

  const rentals = useMemo(() => rentalsData?.rentals ?? [], [rentalsData]);
  const ownedItems = useMemo(() => itemsData?.items ?? [], [itemsData]);

  const renterStats = useMemo(() => {
    const active = rentals.filter(
      (r) => r.status === "ACTIVE" || r.status === "CONFIRMED",
    ).length;
    const pending = rentals.filter((r) => r.status === "PENDING").length;
    const spent = rentals
      .filter((r) => r.status !== "CANCELLED")
      .reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);
    return { active, pending, spent };
  }, [rentals]);

  const ownerStats = useMemo(() => {
    const listed = ownedItems.length;
    const available = ownedItems.filter(
      (i) => i.status === "AVAILABLE",
    ).length;
    const dailyIncome = ownedItems
      .filter((i) => i.status === "AVAILABLE")
      .reduce((sum, i) => sum + (i.pricePerDay ?? 0), 0);
    return { listed, available, dailyIncome };
  }, [ownedItems]);

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-5 rounded-3xl border border-outline-variant bg-surface-container-low p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-title-lg font-semibold text-white"
            aria-hidden="true"
          >
            {user?.fullName ? getInitials(user.fullName) : "U"}
          </span>
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-2.5 py-0.5 text-label-sm font-medium text-on-surface-variant">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Your dashboard
            </span>
            <h1 className="text-h2 font-semibold text-on-surface text-pretty">
              Welcome back, {firstName}
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Track your rentals and listings in one place.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button
            variant="outline"
            render={<Link href={ROUTES.ITEMS}>Browse items</Link>}
            className="border-outline-variant text-on-surface hover:bg-surface-container"
          />
          <Button
            render={
              <Link href={ROUTES.CREATE_ITEM}>
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                List an item
              </Link>
            }
            className="bg-primary text-white hover:bg-primary/90"
          />
        </div>
      </header>

      {/* Needs attention */}
      {renterStats.pending > 0 ? (
        <section
          aria-labelledby="attention-heading"
          className="flex flex-col gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <Clock
              className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600"
              aria-hidden="true"
            />
            <div>
              <h2
                id="attention-heading"
                className="text-body-md font-semibold text-on-surface"
              >
                {renterStats.pending} rental
                {renterStats.pending > 1 ? "s" : ""} awaiting payment
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Complete payment to confirm your booking before it expires.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <Tabs defaultValue="renter" className="flex w-full flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-surface-container-low">
          <TabsTrigger value="renter">As renter</TabsTrigger>
          <TabsTrigger value="owner">As owner</TabsTrigger>
        </TabsList>

        {/* RENTER TAB */}
        <TabsContent value="renter" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Active rentals"
              value={String(renterStats.active)}
              hint="Confirmed or in progress"
              icon={Package}
            />
            <StatCard
              label="Awaiting payment"
              value={String(renterStats.pending)}
              hint="Needs your action"
              icon={Clock}
              accent={renterStats.pending > 0}
            />
            <StatCard
              label="Total spent"
              value={formatCurrency(renterStats.spent)}
              hint="Across all bookings"
              icon={Wallet}
            />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-surface">
              Your rentals
            </h2>
          </div>

          {rentals.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No rentals yet"
              description="Browse the catalog and book your first item from a fellow student."
              actionHref={ROUTES.ITEMS}
              actionLabel="Browse items"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {rentals.map((rental) => (
                <RentalCard
                  key={rental.id}
                  id={rental.id}
                  status={rental.status}
                  startDate={rental.startDate}
                  endDate={rental.endDate}
                  totalPrice={rental.totalPrice}
                  item={rental.item}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* OWNER TAB */}
        <TabsContent value="owner" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Items listed"
              value={String(ownerStats.listed)}
              hint="Your catalog"
              icon={Package}
            />
            <StatCard
              label="Available now"
              value={String(ownerStats.available)}
              hint="Ready to rent"
              icon={CheckCircle2}
            />
            <StatCard
              label="Daily earning potential"
              value={formatCurrency(ownerStats.dailyIncome)}
              hint="If all available items rent"
              icon={TrendingUp}
            />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-surface">
              Your listings
            </h2>
            {ownedItems.length > 0 ? (
              <Link
                href={ROUTES.CREATE_ITEM}
                className="inline-flex items-center gap-1 text-label-lg font-medium text-primary hover:underline"
              >
                Add another
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          {ownedItems.length === 0 ? (
            <EmptyState
              icon={Package}
              title="You haven't listed anything yet"
              description="Turn the gear you already own into income. Listing takes less than a minute."
              actionHref={ROUTES.CREATE_ITEM}
              actionLabel="List an item"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {ownedItems.map((item) => (
                <OwnedItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  category={item.category}
                  pricePerDay={item.pricePerDay}
                  status={item.status}
                  imageUrl={item.imageUrl}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: typeof Package;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-16 text-center">
      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant"
        aria-hidden="true"
      >
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-body-lg font-semibold text-on-surface">{title}</h3>
      <p className="mt-1 max-w-sm text-body-sm text-on-surface-variant text-pretty">
        {description}
      </p>
      <Button
        render={<Link href={actionHref}>{actionLabel}</Link>}
        className="mt-5 bg-primary text-white hover:bg-primary/90"
      />
    </div>
  );
}
