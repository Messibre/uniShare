"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRental, useUpdateRentalStatus } from "@/lib/hooks/useRentals";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  ACTIVE: "bg-green-500/15 text-green-600 border-green-500/20",
  RETURNED: "bg-gray-500/15 text-gray-600 border-gray-500/20",
  OVERDUE: "bg-red-500/15 text-red-600 border-red-500/20",
  CANCELLED: "bg-red-500/15 text-red-600 border-red-500/20",
};

const STATUS_ACTIONS: Record<
  string,
  Array<{
    label: string;
    value: string;
    allowed: ("owner" | "renter" | "admin")[];
  }>
> = {
  PENDING: [
    { label: "Confirm", value: "CONFIRMED", allowed: ["owner", "admin"] },
    {
      label: "Cancel",
      value: "CANCELLED",
      allowed: ["owner", "renter", "admin"],
    },
  ],
  CONFIRMED: [
    {
      label: "Activate (Pickup)",
      value: "ACTIVE",
      allowed: ["owner", "admin"],
    },
    {
      label: "Cancel",
      value: "CANCELLED",
      allowed: ["owner", "renter", "admin"],
    },
  ],
  ACTIVE: [{ label: "Return", value: "RETURNED", allowed: ["owner", "admin"] }],
  OVERDUE: [
    { label: "Return", value: "RETURNED", allowed: ["owner", "admin"] },
  ],
  RETURNED: [],
  CANCELLED: [],
};

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: rental, isLoading } = useRental(id);
  const updateStatus = useUpdateRentalStatus();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        id,
        data: { status: newStatus as any },
      });
      toast.success(`Rental ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error("Failed to update status. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="text-center py-12">
        <h2 className="text-h2 font-h2 text-on-surface">Rental not found</h2>
        <Link
          href={ROUTES.DASHBOARD}
          className="text-primary hover:underline mt-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === rental.ownerId;
  const isRenter = user?.id === rental.renterId;
  const isAdmin = user?.role === "ADMIN";

  const actions = STATUS_ACTIONS[rental.status] || [];
  const availableActions = actions.filter(
    (action) =>
      action.allowed.includes("admin") ||
      (action.allowed.includes("owner") && isOwner) ||
      (action.allowed.includes("renter") && isRenter),
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 font-h2 text-on-surface">Rental Details</h1>
        <Badge
          className={
            STATUS_COLORS[rental.status] || "bg-gray-500/15 text-gray-600"
          }
        >
          {rental.status}
        </Badge>
      </div>

      {/* Item Info */}
      <Card className="bg-surface border-outline-variant">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-surface-container-high overflow-hidden">
              {rental.item?.imageUrl ? (
                <img
                  src={rental.item.imageUrl}
                  alt={rental.item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  📦
                </div>
              )}
            </div>
            <div>
              <Link
                href={`/items/${rental.itemId}`}
                className="text-body-lg font-semibold text-on-surface hover:text-primary"
              >
                {rental.item?.name || "Unknown Item"}
              </Link>
              <p className="text-label-sm text-on-surface-variant">
                {rental.item?.category || "Uncategorized"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rental Info */}
      <Card className="bg-surface border-outline-variant">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-label-sm text-on-surface-variant">
                Start Date
              </p>
              <p className="text-body-md font-medium text-on-surface">
                {formatDate(rental.startDate)}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">End Date</p>
              <p className="text-body-md font-medium text-on-surface">
                {formatDate(rental.endDate)}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">
                Total Price
              </p>
              <p className="text-body-lg font-bold text-primary">
                {formatCurrency(rental.totalPrice)}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Status</p>
              <Badge
                className={
                  STATUS_COLORS[rental.status] || "bg-gray-500/15 text-gray-600"
                }
              >
                {rental.status}
              </Badge>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant">
            <p className="text-label-sm text-on-surface-variant">Renter</p>
            <p className="text-body-md text-on-surface">
              {rental.renter?.fullName || "Unknown"}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {rental.renter?.email || ""}
            </p>
          </div>

          {isOwner && (
            <div className="pt-4 border-t border-outline-variant">
              <p className="text-label-sm text-on-surface-variant">
                You are the owner
              </p>
            </div>
          )}
          {isRenter && (
            <div className="pt-4 border-t border-outline-variant">
              <p className="text-label-sm text-on-surface-variant">
                You are the renter
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Timeline */}
      {rental.statusLogs && rental.statusLogs.length > 0 && (
        <Card className="bg-surface border-outline-variant">
          <CardContent className="p-6">
            <h3 className="text-h3 font-h3 text-on-surface mb-4">Timeline</h3>
            <div className="space-y-3">
              {rental.statusLogs.map((log, index) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary-container" />
                    {index < rental.statusLogs!.length - 1 && (
                      <div className="w-0.5 h-6 bg-outline-variant" />
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">
                      {log.newStatus}
                      {log.oldStatus && (
                        <span className="text-label-sm text-on-surface-variant font-normal">
                          {" "}
                          (from {log.oldStatus})
                        </span>
                      )}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {formatDate(log.createdAt)}
                      {log.note && ` — ${log.note}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {availableActions.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-4">
          {availableActions.map((action) => (
            <Button
              key={action.value}
              onClick={() => handleStatusChange(action.value)}
              disabled={updateStatus.isPending}
              className={`${
                action.value === "CANCELLED"
                  ? "bg-error text-white hover:bg-error/80"
                  : "bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
              }`}
            >
              {updateStatus.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </span>
              ) : (
                action.label
              )}
            </Button>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => router.back()}
        className="border-outline text-on-surface hover:bg-surface-container"
      >
        ← Back
      </Button>
    </div>
  );
}
