import prisma from "@/lib/prisma";

export type GetItemsFilters = {
  search?: string | null;
  category?: string | null;
  minPrice?: string | number | null;
  maxPrice?: string | number | null;
  page?: string | number | null;
  limit?: string | number | null;
  // When set, scope results to a single owner and return items of every
  // status (a user's own listings include RENTED/MAINTENANCE, not just
  // AVAILABLE). Left unset for the public catalog, which stays AVAILABLE-only.
  ownerId?: string | null;
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

function toPositiveInt(value: unknown, fallback: number) {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Shared data-layer query used by both the /items server component and the
// /api/v1/items route, so the page renders directly from the database instead
// of doing a fragile server-to-server self-fetch to its own API. Returns a
// consistent { items, pagination } shape so search/filter/pagination behave
// the same whether rendered on the server or refetched on the client.
export async function getItems(filters: GetItemsFilters = {}) {
  const { search, category, minPrice, maxPrice, ownerId } = filters;

  const page = toPositiveInt(filters.page, 1);
  const limit = Math.min(toPositiveInt(filters.limit, DEFAULT_LIMIT), MAX_LIMIT);

  const where: any = ownerId
    ? { ownerId }
    : { status: "AVAILABLE" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (minPrice || maxPrice) {
    where.pricePerDay = {};
    if (minPrice) where.pricePerDay.gte = parseFloat(String(minPrice));
    if (maxPrice) where.pricePerDay.lte = parseFloat(String(maxPrice));
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
