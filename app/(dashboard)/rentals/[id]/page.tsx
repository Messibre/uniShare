"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRental, useUpdateRentalStatus } from "@/lib/hooks/useRentals";
import { usePayNow } from "@/lib/hooks/usePayments";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SafeImage } from "@/components/shared/SafeImage";
import { ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning border-warning/30",
  CONFIRMED: "bg-primary-container/15 text-primary border-primary-container/30",
  ACTIVE: "bg-success/15 text-success border-success/30",
  RETURNED: "bg-surface-container-high text-on-surface-variant border-outline",
  OVERDUE: "bg-error/15 text-error border-error/30",
  CANCELLED: "bg-error/15 text-error border-error/30",
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <div className="text-body-md font-medium text-on-surface">{children}</div>
    </div>
  );
}

export default function RentalDetailPage() {
  const id = useParams<{ id: string }>()?.id ?? "";
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: rental, isLoading } = useRental(id);
  const updateStatus = useUpdateRentalStatus();
  const { payNow, isPaying } = usePayNow();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        id,
        data: { status: newStatus as any },
      });
      toast.success(`Rental ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to update status. Please try again.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-h2 font-h2 text-on-surface">Rental not found</h2>
        <Link
          href={ROUTES.DASHBOARD}
          className="mt-4 inline-block text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === rental.ownerId;
  const isRenter = user?.id === rental.renterId;
  const showPay = isRenter && rental.status === "PENDING";

  const actions = STATUS_ACTIONS[rental.status] || [];
  const availableActions = actions.filter(
    (action) =>
      action.allowed.includes("admin") ||
      (action.allowed.includes("owner") && isOwner) ||
      (action.allowed.includes("renter") && isRenter),
  );

  const statusClass =
    STATUS_COLORS[rental.status] ||
    "bg-surface-container-high text-on-surface-variant";
  const logs = rental.statusLogs ?? [];
  const roleLabel = isOwner ? "Owner" : isRenter ? "Renter" : null;

  return (
    <div className="flex flex-col gap-5 lg:h-[calc(100dvh-15rem)] lg:min-h-[28rem]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2 gap-1.5 text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
          <h1 className="text-h2 font-semibold text-on-surface">
            Rental details
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {roleLabel && (
            <Badge variant="outline" className="border-outline">
              You are the {roleLabel.toLowerCase()}
            </Badge>
          )}
          <Badge className={statusClass}>{rental.status}</Badge>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2">
        {/* Item + booking facts */}
        <section
          aria-label="Booking"
          className="flex min-h-0 flex-col gap-5 rounded-xl border border-outline bg-surface p-5 shadow-[var(--shadow-level-1)]"
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-outline bg-surface-container-high">
              {rental.item?.imageUrl ? (
                <SafeImage
                  src={rental.item.imageUrl}
                  alt={rental.item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                  <Package className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/items/${rental.itemId}`}
                className="block truncate text-body-lg font-semibold text-on-surface hover:text-primary"
              >
                {rental.item?.name || "Unknown Item"}
              </Link>
              <p className="text-label-sm text-on-surface-variant">
                {rental.item?.category || "Uncategorized"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-outline/60 pt-4">
            <Field label="Start date">{formatDate(rental.startDate)}</Field>
            <Field label="End date">{formatDate(rental.endDate)}</Field>
            <Field label="Total price">
              <span className="text-body-lg font-bold text-primary">
                {formatCurrency(rental.totalPrice)}
              </span>
            </Field>
            <Field label="Renter">
              <span className="block truncate">
                {rental.renter?.fullName || "Unknown"}
              </span>
              {rental.renter?.email && (
                <span className="block truncate text-label-sm font-normal text-on-surface-variant">
                  {rental.renter.email}
                </span>
              )}
            </Field>
          </div>

          {(availableActions.length > 0 || showPay) && (
            <div className="mt-auto flex flex-wrap gap-3 border-t border-outline/60 pt-4">
              {showPay && (
                <Button
                  onClick={() => payNow(rental.id)}
                  disabled={isPaying}
                  className="bg-primary-container text-on-primary-container hover:bg-primary-container/90"
                >
                  {isPaying
                    ? "Redirecting..."
                    : `Pay ${formatCurrency(rental.totalPrice)}`}
                </Button>
              )}
              {availableActions.map((action) => (
                <Button
                  key={action.value}
                  onClick={() =>
                    action.value === "CANCELLED"
                      ? setConfirmCancel(true)
                      : handleStatusChange(action.value)
                  }
                  disabled={updateStatus.isPending}
                  className={
                    action.value === "CANCELLED"
                      ? "bg-error text-on-error hover:bg-error/90"
                      : "bg-primary-container text-on-primary-container hover:bg-primary-container/90"
                  }
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

          <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this rental?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can&apos;t be undone. The booking will be closed for
                  both the owner and the renter.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep rental</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusChange("CANCELLED")}
                  className="bg-error text-on-error hover:bg-error/90"
                >
                  Cancel rental
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* Timeline: scrolls internally so the page itself never has to */}
        <section
          aria-label="Timeline"
          className="flex min-h-0 flex-col rounded-xl border border-outline bg-surface p-5 shadow-[var(--shadow-level-1)]"
        >
          <h2 className="mb-4 text-body-lg font-semibold text-on-surface">
            Timeline
          </h2>
          {logs.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              No status changes yet.
            </p>
          ) : (
            <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {logs.map((log, index) => (
                <li key={log.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary-container" />
                    {index < logs.length - 1 && (
                      <div className="h-6 w-0.5 bg-outline" />
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">
                      {log.newStatus}
                      {log.oldStatus && (
                        <span className="text-label-sm font-normal text-on-surface-variant">
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
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
