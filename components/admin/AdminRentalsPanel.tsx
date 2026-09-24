"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { useAdminRentals } from "@/lib/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { getRentalStatusColor } from "@/lib/utils/status";
import { RENTAL_STATUSES } from "@/lib/utils/constants";

export function AdminRentalsPanel() {
  const [status, setStatus] = useState<string>("all");
  const { data, isLoading } = useAdminRentals({
    status: status === "all" ? undefined : status,
    limit: 20,
  });

  const rentals = data?.rentals ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label-sm text-on-surface-variant">
          Showing the most recent rentals
        </p>
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(RENTAL_STATUSES).map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : rentals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
            <Receipt className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-body-md text-on-surface-variant">
            No rentals match this status.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-[var(--shadow-level-1)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Renter</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-on-surface">
                    {r.item?.name || "Unknown"}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {r.renter?.fullName || "Unknown"}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {r.owner?.fullName || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getRentalStatusColor(r.status)}
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-on-surface">
                    {formatCurrency(r.totalPrice)}
                  </TableCell>
                  <TableCell className="text-label-sm text-on-surface-variant">
                    {formatDate(r.startDate)} → {formatDate(r.endDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
