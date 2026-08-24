"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useItems } from "@/lib/hooks/useItems";
import { ITEM_CATEGORIES } from "@/lib/utils/constants";
import { formatCurrency } from "@/lib/utils/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 12;

export default function ItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from URL
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const [searchInput, setSearchInput] = useState(search);

  // Build query params
  const buildQuery = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });
      return params.toString();
    },
    [searchParams],
  );

  const updateFilters = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const query = buildQuery(updates);
      router.push(`/items${query ? `?${query}` : ""}`);
    },
    [router, buildQuery],
  );

  // Fetch items
  const { data, isLoading, isFetching } = useItems({
    search: search || undefined,
    category: category || undefined,
    page,
    limit: ITEMS_PER_PAGE,
    available: true,
  });

  const items = data?.items || [];
  const pagination = data?.pagination;

  // Categories filter (pills)
  const handleCategoryClick = (cat: string) => {
    const newCategory = category === cat ? "" : cat;
    updateFilters({ category: newCategory, page: 1 });
  };

  // Search debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 font-h2 text-on-surface">Browse Items</h1>
        <p className="text-body-sm text-on-surface-variant">
          Find the perfect gear for your next project or event.
        </p>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            type="text"
            placeholder="Search items..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-surface-container-low border-outline rounded-full h-10 focus:ring-primary"
          />
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryClick("")}
          className={`px-4 py-1.5 rounded-full text-label-sm font-medium transition-colors ${
            !category
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          All
        </button>
        {ITEM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-4 py-1.5 rounded-full text-label-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <span className="text-body-sm text-on-surface-variant">
          {isLoading ? "Loading..." : `${pagination?.total || 0} items`}
        </span>
        {isFetching && !isLoading && (
          <span className="text-label-sm text-on-surface-variant">
            Updating...
          </span>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-outline-variant rounded-xl overflow-hidden"
            >
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
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
                    variant="outline"
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
                <div className="flex items-start justify-between">
                  <h3 className="text-body-md font-semibold text-on-surface line-clamp-1">
                    {item.name}
                  </h3>
                </div>
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
                  {item.owner && (
                    <span className="text-label-sm text-on-surface-variant">
                      {item.owner.fullName.split(" ")[0]}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-body-sm text-on-surface-variant">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
