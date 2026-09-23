import Link from "next/link";
import { Package, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { getItemStatusColor } from "@/lib/utils/status";

interface OwnedItemCardProps {
  id: string;
  name: string;
  category: string;
  pricePerDay: number;
  status: string;
  imageUrl?: string;
}

export function OwnedItemCard({
  id,
  name,
  category,
  pricePerDay,
  status,
  imageUrl,
}: OwnedItemCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-level-2)]">
      <div className="flex gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl || "/placeholder.svg"}
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
              {name}
            </h3>
            <Badge
              className={`shrink-0 border text-label-sm font-medium ${getItemStatusColor(status)}`}
            >
              {status}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-label-sm text-on-surface-variant">
            {category}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-outline-variant px-4 py-3">
        <span className="text-body-lg font-semibold text-primary">
          {formatCurrency(pricePerDay)}
          <span className="text-label-sm font-normal text-on-surface-variant">
            {" "}
            / day
          </span>
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            render={
              <Link href={`/items/${id}/edit`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </Link>
            }
            className="border-outline-variant text-on-surface hover:bg-surface-container"
          />
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/items/${id}`}>View</Link>}
            className="border-outline-variant text-on-surface hover:bg-surface-container"
          />
        </div>
      </div>
    </article>
  );
}
