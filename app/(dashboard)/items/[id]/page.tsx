"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarIcon, User, Star, Loader2, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useItem } from "@/lib/hooks/useItems";
import { useCreateRental } from "@/lib/hooks/useRentals";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatCurrency } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
      toast.error("Please sign in to rent items", {
        description: "You'll be redirected to the login page.",
        action: {
          label: "Sign In",
          onClick: () => router.push(ROUTES.LOGIN),
        },
      });
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-16 w-16 text-on-surface-variant" />
          </div>
          <h2 className="text-h2 font-h2 text-on-surface">
            {error?.message?.includes("404")
              ? "Item not found"
              : "Something went wrong"}
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-md mx-auto">
            {error?.message?.includes("404")
              ? "The item you're looking for doesn't exist or has been removed."
              : "We couldn't load this item. Please try again later."}
          </p>
          <Link
            href={ROUTES.ITEMS}
            className="inline-flex items-center justify-center rounded-md bg-primary-container text-on-primary-container hover:bg-primary hover:text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Browse Items
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.ownerId;
  const isAvailable = item.status === "AVAILABLE";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 text-on-surface-variant hover:text-primary"
        onClick={() => router.back()}
      >
        ← Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="relative aspect-square lg:aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-high">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <span className="text-body-lg">No image available</span>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Badge
                className={`${
                  isAvailable
                    ? "bg-primary-container/15 text-primary-container border-primary-container/20"
                    : "bg-on-surface-variant/10 text-on-surface-variant border-outline/50"
                } backdrop-blur-sm px-4 py-1.5 text-label-sm`}
              >
                {isAvailable ? "Available" : item.status}
              </Badge>
            </div>
            {isOwner && (
              <div className="absolute bottom-4 left-4">
                <Badge
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm"
                >
                  Your item
                </Badge>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-h2 font-h2 text-on-surface">{item.name}</h1>
                <Badge
                  variant="secondary"
                  className="mt-2 bg-surface-container-high"
                >
                  {item.category}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-h2 font-h2 text-primary">
                  {formatCurrency(item.pricePerDay)}
                </span>
                <span className="text-body-sm text-on-surface-variant block">
                  per day
                </span>
              </div>
            </div>

            <p className="text-body-md text-on-surface-variant mt-4 whitespace-pre-wrap">
              {item.description || "No description provided."}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 p-4 rounded-xl bg-surface-container-low">
              <div>
                <p className="text-label-sm text-on-surface-variant">
                  Category
                </p>
                <p className="text-body-md font-medium text-on-surface">
                  {item.category}
                </p>
              </div>
              {item.deposit !== undefined && item.deposit > 0 && (
                <div>
                  <p className="text-label-sm text-on-surface-variant">
                    Deposit
                  </p>
                  <p className="text-body-md font-medium text-on-surface">
                    {formatCurrency(item.deposit)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-label-sm text-on-surface-variant">Status</p>
                <p className="text-body-md font-medium text-on-surface capitalize">
                  {item.status.toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <Card className="bg-surface-container-low border-outline-variant">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-body-md font-medium text-on-surface">
                    {item.owner?.fullName || "Unknown"}
                  </p>
                  <div className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span>4.9</span>
                    <span className="mx-1">•</span>
                    <span>12 rentals</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-outline-variant"
              >
                Message
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Booking Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 bg-surface-container-lowest border-outline-variant shadow-[--shadow-level-2]">
            <CardContent className="p-6 space-y-4">
              <div className="text-center border-b border-outline-variant pb-4">
                <span className="text-h3 font-h3 text-primary">
                  {formatCurrency(item.pricePerDay)}
                  <span className="text-body-sm font-normal text-on-surface-variant">
                    {" "}
                    / day
                  </span>
                </span>
              </div>

              {!isAvailable ? (
                <div className="text-center py-8">
                  <p className="text-body-lg text-on-surface-variant">
                    This item is currently
                  </p>
                  <p className="text-h3 font-h3 text-on-surface capitalize">
                    {item.status.toLowerCase()}
                  </p>
                  <Button
                    disabled
                    className="w-full mt-4 bg-primary-container/50 text-on-primary-container/50"
                  >
                    Not Available
                  </Button>
                </div>
              ) : isOwner ? (
                <div className="text-center py-8">
                  <p className="text-body-md text-on-surface-variant">
                    This is your own item.
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    You can't rent your own items.
                  </p>
                  <Link
                    href={`/items/${item.id}/edit`}
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary-container text-on-primary-container hover:bg-primary hover:text-white px-4 py-2 text-sm font-medium transition-colors mt-4"
                  >
                    Edit Listing
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label
                        htmlFor="start-date"
                        className="text-label-sm text-on-surface-variant"
                      >
                        Start Date
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                        <Input
                          id="start-date"
                          type="date"
                          min={format(new Date(), "yyyy-MM-dd")}
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setDateError("");
                          }}
                          className="pl-10 bg-surface-container-low border-outline"
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="end-date"
                        className="text-label-sm text-on-surface-variant"
                      >
                        End Date
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                        <Input
                          id="end-date"
                          type="date"
                          min={startDate || format(new Date(), "yyyy-MM-dd")}
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setDateError("");
                          }}
                          className="pl-10 bg-surface-container-low border-outline"
                        />
                      </div>
                    </div>
                    {dateError && (
                      <p className="text-label-sm text-error">{dateError}</p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <div className="flex justify-between text-body-sm text-on-surface-variant">
                      <span>Price per day</span>
                      <span>{formatCurrency(item.pricePerDay)}</span>
                    </div>
                    {total && (
                      <>
                        <div className="flex justify-between text-body-sm text-on-surface-variant">
                          <span>
                            {total.days} day{total.days > 1 ? "s" : ""}
                          </span>
                          <span>
                            {formatCurrency(total.days * item.pricePerDay)}
                          </span>
                        </div>
                        {item.deposit && item.deposit > 0 && (
                          <div className="flex justify-between text-body-sm text-on-surface-variant">
                            <span>Deposit</span>
                            <span>{formatCurrency(item.deposit)}</span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between text-body-lg font-semibold text-on-surface">
                          <span>Total</span>
                          <span>{formatCurrency(total.total)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={handleRent}
                    disabled={createRental.isPending || !total}
                    className="w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
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
                    You won't be charged yet
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
