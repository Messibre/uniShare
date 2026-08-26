import { Suspense } from "react";
import { ItemsList } from "@/components/items/ItemsList";
import ItemsLoading from "./loading";

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 font-h2 text-on-surface">Browse Items</h1>
        <p className="text-body-sm text-on-surface-variant">
          Find the perfect gear for your next project or event.
        </p>
      </div>

      <Suspense fallback={<ItemsLoading />}>
        <ItemsList />
      </Suspense>
    </div>
  );
}
