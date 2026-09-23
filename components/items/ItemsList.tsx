"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Controlled search field, kept in sync with the URL so browser back/forward
  // and filter chips stay consistent with what's typed.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const { data, isFetching } = useItems(
    {
      search: search || undefined,
      category: category || undefined,
      page,
      limit: 12,
      available: true,
    },
    { initialData },
  );

  const items = data?.items || [];
  const pagination = data?.pagination;
  const hasFilters = Boolean(search || category);

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

  const submitSearch = () => updateFilters({ search: searchInput.trim(), page: 1 });

  const clearAll = () => {
    setSearchInput("");
    router.push("/items");
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
        />
        <label htmlFor="item-search" className="sr-only">
          Search items
        </label>
        <input
          id="item-search"
          type="search"
          enterKeyHint="search"
          placeholder="Search items by name…"
          className="w-full rounded-full border border-outline bg-surface-container-low py-2.5 pl-10 pr-10 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              submitSearch();
            }
          }}
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              if (search) updateFilters({ search: undefined, page: 1 });
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category quick-filter pills — single, visible category filter */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => updateFilters({ category: undefined, page: 1 })}
          aria-pressed={!category}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-label-md font-medium transition-colors ${
            !category
              ? "border-primary bg-primary text-on-primary"
              : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          All
        </button>
        {ITEM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => updateFilters({ category: cat, page: 1 })}
            aria-pressed={category === cat}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-label-md font-medium transition-colors ${
              category === cat
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Result summary + active filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-sm text-on-surface-variant" aria-live="polite">
          {isFetching ? (
            "Loading…"
          ) : (
            <>
              <span className="font-medium text-on-surface">
                {pagination?.total || 0}
              </span>{" "}
              {pagination?.total === 1 ? "item" : "items"}
              {search && (
                <>
                  {" "}
                  for <span className="text-on-surface">&ldquo;{search}&rdquo;</span>
                </>
              )}
              {category && (
                <>
                  {" "}
                  in <span className="text-on-surface">{category}</span>
                </>
              )}
            </>
          )}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-md font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-outline-variant py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high">
            <Search className="h-5 w-5 text-on-surface-variant" />
          </div>
          <p className="mt-4 text-body-lg font-medium text-on-surface">
            No items found
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Try a different search or category.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-md font-medium text-on-primary transition-colors hover:bg-primary/90"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="group overflow-hidden rounded-xl border border-outline-variant bg-surface transition-shadow duration-200 hover:shadow-[var(--shadow-level-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div className="relative h-48 bg-surface-container-high">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-container text-on-surface-variant">
                    <span className="text-body-sm">No image</span>
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge
                    className={`${
                      item.status === "AVAILABLE"
                        ? "border-primary-container/20 bg-primary-container/15 text-primary-container"
                        : "border-outline/50 bg-on-surface-variant/10 text-on-surface-variant"
                    } backdrop-blur-sm`}
                  >
                    {item.status === "AVAILABLE" ? "Available" : item.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-body-md font-semibold text-on-surface line-clamp-1">
                    {item.name}
                  </h3>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-surface-container-high text-label-sm"
                >
                  {item.category}
                </Badge>
                <p className="mt-1 text-body-sm text-on-surface-variant line-clamp-2">
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
        <nav
          className="flex items-center justify-center gap-2 pt-4"
          aria-label="Pagination"
        >
          <button
            className="inline-flex items-center gap-1 rounded-full border border-outline px-4 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pagination.page <= 1}
            onClick={() => updateFilters({ page: pagination.page - 1 })}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="px-2 text-body-sm text-on-surface-variant">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="inline-flex items-center gap-1 rounded-full border border-outline px-4 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => updateFilters({ page: pagination.page + 1 })}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
