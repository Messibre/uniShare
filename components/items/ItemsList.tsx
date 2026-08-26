"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useItems } from "@/lib/hooks/useItems";
import { ITEM_CATEGORIES } from "@/lib/utils/constants";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

interface ItemsListProps {
  initialData: {
    items: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function ItemsList({ initialData }: ItemsListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  // Use the hook with initialData (server‑fetched data)
  const { data } = useItems(
    {
      search: search || undefined,
      category: category || undefined,
      page,
      limit: 12,
      available: true,
    },
    { initialData }, // Pre‑fills the cache, SEO safe
  );

  const items = data?.items || [];
  const pagination = data?.pagination;

  const updateFilters = (
    updates: Record<string, string | number | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    router.push(`/items${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search items..."
          className="flex-1 px-4 py-2 bg-surface-container-low border border-outline rounded-full focus:ring-primary focus:border-primary"
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilters({ search: e.currentTarget.value, page: 1 });
            }
          }}
        />
        <select
          className="w-[180px] px-3 py-2 bg-surface-container-low border border-outline rounded-md focus:ring-primary focus:border-primary"
          defaultValue={category}
          onChange={(e) => updateFilters({ category: e.target.value, page: 1 })}
        >
          <option value="">All Categories</option>
          {ITEM_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <div className="flex justify-between items-center">
        <span className="text-body-sm text-on-surface-variant">
          {pagination?.total || 0} items
        </span>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-body-lg text-on-surface-variant">No items found</p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="group bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-[--shadow-level-2] transition-shadow duration-200"
            >
              <div className="relative h-48 bg-surface-container-high">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant bg-surface-container">
                    <span className="text-body-sm">No image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge
                    className={`${
                      item.status === "AVAILABLE"
                        ? "bg-primary-container/15 text-primary-container border-primary-container/20"
                        : "bg-on-surface-variant/10 text-on-surface-variant border-outline/50"
                    } backdrop-blur-sm`}
                  >
                    {item.status === "AVAILABLE" ? "Available" : item.status}
                  </Badge>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <h3 className="text-body-md font-semibold text-on-surface line-clamp-1">
                  {item.name}
                </h3>
                <Badge
                  variant="secondary"
                  className="text-label-sm bg-surface-container-high"
                >
                  {item.category}
                </Badge>
                <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-1">
                  {item.description || "No description"}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-h3 font-h3 text-on-surface">
                    {formatCurrency(item.pricePerDay)}
                    <span className="text-body-sm font-normal text-on-surface-variant">
                      /day
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            className="px-4 py-2 border border-outline rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
            disabled={pagination.page <= 1}
            onClick={() => updateFilters({ page: pagination.page - 1 })}
          >
            Previous
          </button>
          <span className="text-body-sm text-on-surface-variant">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="px-4 py-2 border border-outline rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => updateFilters({ page: pagination.page + 1 })}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
