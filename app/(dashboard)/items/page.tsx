import { Suspense } from "react";
import { connection } from "next/server";
import ItemsLoading from "./loading";
import { ItemsList } from "@/components/items/ItemsList";
import { getItems } from "@/lib/items";

const PAGE_LIMIT = 12;

// Server-side data fetching (SEO friendly). Queries the database directly
// instead of self-fetching /api/v1/items, which avoids a fragile
// server-to-server loopback request during render.
async function getInitialItems() {
  // Opt out of static prerendering (cacheComponents is enabled). Live
  // inventory must render at request time; without this, Next tries to
  // prerender /items and Prisma's internal `new Date()` breaks the build.
  await connection();

  const items = await getItems();
  const total = items.length;
  return {
    items,
    pagination: {
      page: 1,
      limit: PAGE_LIMIT,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_LIMIT)),
    },
  };
}

export default async function ItemsPage() {
  const initialData = await getInitialItems();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-label-sm font-medium text-on-surface-variant">
          Marketplace
        </span>
        <h1 className="text-h2 font-semibold text-on-surface">Browse Items</h1>
        <p className="text-body-md text-on-surface-variant">
          Find the perfect gear for your next project or event.
        </p>
      </div>

      <Suspense fallback={<ItemsLoading />}>
        <ItemsList initialData={initialData} />
      </Suspense>
    </div>
  );
}
