"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { usePayNow } from "@/lib/hooks/usePayments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateRange } from "@/lib/utils/format";
import { getRentalStatusColor } from "@/lib/utils/status";

interface RentalCardItem {
  name?: string;
  imageUrl?: string;
}

interface RentalCardProps {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  item?: RentalCardItem;
  canPay?: boolean;
}

export function RentalCard({
  id,
  status,
  startDate,
  endDate,
  totalPrice,
  item,
  canPay = true,
}: RentalCardProps) {
  const { payNow, isPaying } = usePayNow();

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-outline bg-surface shadow-[var(--shadow-level-1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-level-2)]">
      <div className="flex gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container">
          {item?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl || "/placeholder.svg"}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Package
              className="h-6 w-6 text-on-surface-variant"
              aria-hidden="true"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-body-md font-semibold text-on-surface">
              {item?.name || "Unknown item"}
            </h3>
            <Badge
              className={`shrink-0 border text-label-sm font-medium ${getRentalStatusColor(status)}`}
            >
              {status}
            </Badge>
          </div>
          <p className="mt-0.5 text-label-sm text-on-surface-variant">
            {formatDateRange(startDate, endDate)}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-outline/60 px-4 py-3">
        <span className="text-body-lg font-semibold text-primary">
          {formatCurrency(totalPrice)}
        </span>
        <div className="flex items-center gap-2">
          {status === "PENDING" && canPay ? (
            <Button
              size="sm"
              onClick={() => payNow(id)}
              disabled={isPaying}
              className="bg-primary-container text-on-primary-container hover:bg-primary-container/90"
            >
              {isPaying ? "Redirecting..." : "Pay now"}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/rentals/${id}`}>View</Link>}
            className="border-outline-variant text-on-surface hover:bg-surface-container"
          />
        </div>
      </div>
    </article>
  );
}
