import { Suspense } from "react";
import ItemsLoading from "./loading";
import { ItemsList } from "@/components/items/ItemsList";

// Server-side data fetching (SEO friendly)
async function getInitialItems() {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/items?limit=12`, {
    cache: "no-store", // For dynamic content; use "force-cache" if static
  });
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export default async function ItemsPage() {
  const initialData = await getInitialItems();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 font-h2 text-on-surface">Browse Items</h1>
        <p className="text-body-sm text-on-surface-variant">
          Find the perfect gear for your next project or event.
        </p>
      </div>

      <Suspense fallback={<ItemsLoading />}>
        <ItemsList initialData={initialData} />
      </Suspense>
    </div>
  );
}
