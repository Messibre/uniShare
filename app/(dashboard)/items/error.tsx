"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/utils/constants";

export default function ItemsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Items page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-2xl font-semibold text-on-surface">
        Failed to load items
      </h2>
      <p className="mt-2 text-body-md text-on-surface-variant">
        We couldn't load the item list. Please try again.
      </p>
      <div className="mt-6 flex gap-4">
        <Button
          onClick={reset}
          className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
        >
          Retry
        </Button>
        <Button
          render={<Link href={ROUTES.HOME}>Go Home</Link>}
          variant="outline"
          className="border-outline text-on-surface hover:bg-surface-container"
        ></Button>
      </div>
    </div>
  );
}
