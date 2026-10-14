"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarIcon,
  User,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useItem } from "@/lib/hooks/useItems";
import { useCreateRental } from "@/lib/hooks/useRentals";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatCurrency } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SafeImage } from "@/components/shared/SafeImage";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");

  const { data: item, isLoading, error } = useItem(id);
  const createRental = useCreateRental();

  const calculateTotal = useCallback(() => {
    if (!startDate || !endDate || !item) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return null;
    const days = differenceInDays(end, start);
    return {
      days,
      total: days * item.pricePerDay + (item.deposit || 0),
    };
  }, [startDate, endDate, item]);

  const total = calculateTotal();

  const validateDates = useCallback(() => {
    if (!startDate || !endDate) {
      setDateError("Please select both dates");
      return false;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      setDateError("End date must be after start date");
      return false;
    }
    if (start < new Date()) {
      setDateError("Start date cannot be in the past");
      return false;
    }
    setDateError("");
    return true;
  }, [startDate, endDate]);

  const handleRent = async () => {
    if (!isAuthenticated) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(`/items/${id}`)}`;
      router.push(redirectUrl);
      return;
    }

    if (!user?.isIdVerified) {
      toast.error("ID verification required", {
        description: "Please verify your ID before renting items.",
        action: {
          label: "Go to Profile",
          onClick: () => router.push(ROUTES.PROFILE),
        },
      });
      return;
    }

    if (!validateDates()) {
      toast.error(dateError || "Please check your dates");
      return;
    }

    try {
      await createRental.mutateAsync({
        itemId: id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      toast.success("Rental requested successfully!", {
        description: "The owner will confirm your request shortly.",
      });

      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      const message = error?.message || "Failed to request rental";

      if (message.includes("already booked")) {
        toast.error("Item is already booked for these dates", {
          description: "Please select different dates.",
        });
      } else if (message.includes("own item")) {
        toast.error("You cannot rent your own item", {
          description: "Try browsing other items instead.",
        });
      } else if (message.includes("not available")) {
        toast.error("Item is not available", {
          description: "This item is currently not available for rent.",
        });
      } else {
        toast.error("Something went wrong", {
          description: "Please try again later.",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:h-[calc(100dvh-15rem)] lg:min-h-[28rem] lg:grid-cols-2">
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

  if (error || !item) {
    return (
      <div className="py-16">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <AlertCircle className="h-16 w-16 text-on-surface-variant" />
          </div>
          <h2 className="text-h2 font-h2 text-on-surface">
            {error?.message?.includes("404")
              ? "Item not found"
              : "Something went wrong"}
          </h2>
          <p className="mx-auto max-w-md text-body-md text-on-surface-variant">
            {error?.message?.includes("404")
              ? "The item you're looking for doesn't exist or has been removed."
              : "We couldn't load this item. Please try again later."}
          </p>
          <Link
            href={ROUTES.ITEMS}
            className="inline-flex items-center justify-center rounded-full bg-primary-container px-4 py-2 text-sm font-medium text-on-primary-container transition-colors hover:bg-primary-container/90"
          >
            Browse Items
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.ownerId;
  const isAvailable = item.status === "AVAILABLE";
  const hasDeposit = item.deposit !== undefined && item.deposit > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:h-[calc(100dvh-15rem)] lg:min-h-[28rem] lg:grid-cols-2">
      {/* Image: fills the available height instead of dictating it */}
      <div className="relative h-64 overflow-hidden rounded-xl border border-outline bg-surface-container-high sm:h-80 lg:h-full">
        {item.imageUrl ? (
          <SafeImage
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
            <span className="text-body-lg">No image available</span>
          </div>
        )}
        <div className="absolute right-3 top-3">
          <Badge
            className={`${
              isAvailable
                ? "border-primary-container/20 bg-primary-container/15 text-primary-container"
                : "border-outline/50 bg-on-surface-variant/10 text-on-surface-variant"
            } px-3 py-1 text-label-sm backdrop-blur-sm`}
          >
            {isAvailable ? "Available" : item.status}
          </Badge>
        </div>
        {isOwner && (
          <div className="absolute bottom-3 left-3">
            <Badge
              variant="outline"
              className="bg-background/80 backdrop-blur-sm"
            >
              Your item
            </Badge>
          </div>
        )}
      </div>

      {/* Details + booking */}
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1.5 text-on-surface-variant hover:text-primary"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push(ROUTES.ITEMS);
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to items
          </Button>
          <Badge
            variant="secondary"
            className="bg-surface-container-high"
          >
            {item.category}
          </Badge>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-h2 font-h2 text-on-surface text-balance">
              {item.name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
              <User className="h-4 w-4" aria-hidden="true" />
              Listed by{" "}
              <span className="font-medium text-on-surface">
                {item.owner?.fullName || "a UniShare member"}
              </span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-h2 font-h2 text-primary">
              {formatCurrency(item.pricePerDay)}
            </span>
            <span className="block text-body-sm text-on-surface-variant">
              per day
            </span>
          </div>
        </div>

        <p className="line-clamp-4 min-h-0 whitespace-pre-wrap text-body-md text-on-surface-variant">
          {item.description || "No description provided."}
        </p>

        {hasDeposit && (
          <div className="flex items-center justify-between rounded-lg border border-outline bg-surface-container-low px-4 py-2.5 text-body-sm">
            <span className="text-on-surface-variant">Refundable deposit</span>
            <span className="font-medium text-on-surface">
              {formatCurrency(item.deposit as number)}
            </span>
          </div>
        )}

        {/* Booking panel pinned to the bottom of the column */}
        <div className="mt-auto rounded-xl border border-outline bg-surface-container-lowest p-4 shadow-[var(--shadow-level-1)]">
          {!isAvailable ? (
            <div className="space-y-3 text-center">
              <p className="text-body-md text-on-surface-variant">
                This item is currently{" "}
                <span className="font-semibold capitalize text-on-surface">
                  {item.status.toLowerCase()}
                </span>
              </p>
              <Button
                disabled
                className="w-full bg-primary-container/50 text-on-primary-container/50"
              >
                Not Available
              </Button>
            </div>
          ) : isOwner ? (
            <div className="space-y-3 text-center">
              <p className="text-body-sm text-on-surface-variant">
                This is your own item, so you can&apos;t rent it.
              </p>
              <Link
                href={`/items/${item.id}/edit`}
                className="inline-flex w-full items-center justify-center rounded-full bg-primary-container px-4 py-2 text-sm font-medium text-on-primary-container transition-colors hover:bg-primary-container/90"
              >
                Edit Listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="start-date"
                    className="text-label-sm text-on-surface-variant"
                  >
                    Start date
                  </Label>
                  <div className="relative">
                    <CalendarIcon
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                      aria-hidden="true"
                    />
                    <Input
                      id="start-date"
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDateError("");
                      }}
                      className="border-outline bg-surface-container-low pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="end-date"
                    className="text-label-sm text-on-surface-variant"
                  >
                    End date
                  </Label>
                  <div className="relative">
                    <CalendarIcon
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                      aria-hidden="true"
                    />
                    <Input
                      id="end-date"
                      type="date"
                      min={startDate || format(new Date(), "yyyy-MM-dd")}
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDateError("");
                      }}
                      className="border-outline bg-surface-container-low pl-9"
                    />
                  </div>
                </div>
              </div>
              {dateError && (
                <p className="text-label-sm text-error">{dateError}</p>
              )}

              <div className="flex items-center justify-between border-t border-outline-variant pt-3 text-body-sm">
                {total ? (
                  <>
                    <span className="text-on-surface-variant">
                      {total.days} day{total.days > 1 ? "s" : ""}
                      {hasDeposit ? " + deposit" : ""}
                    </span>
                    <span className="text-body-lg font-semibold text-on-surface">
                      {formatCurrency(total.total)}
                    </span>
                  </>
                ) : (
                  <span className="text-on-surface-variant">
                    Pick your dates to see the total
                  </span>
                )}
              </div>

              <Button
                onClick={handleRent}
                disabled={createRental.isPending || !total}
                className="w-full bg-primary-container text-on-primary-container hover:bg-primary-container/90"
              >
                {createRental.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Rent Now"
                )}
              </Button>
              <p className="text-center text-label-sm text-on-surface-variant">
                You won&apos;t be charged until the owner confirms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
