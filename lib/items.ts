import prisma from "@/lib/prisma";

export type GetItemsFilters = {
  search?: string | null;
  category?: string | null;
  minPrice?: string | number | null;
  maxPrice?: string | number | null;
};

// Shared data-layer query used by both the /items server component and the
// /api/v1/items route, so the page renders directly from the database instead
// of doing a fragile server-to-server self-fetch to its own API.
export async function getItems(filters: GetItemsFilters = {}) {
  const { search, category, minPrice, maxPrice } = filters;

  const where: any = {
    status: "AVAILABLE",
  };

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

  return prisma.item.findMany({
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
  });
}
