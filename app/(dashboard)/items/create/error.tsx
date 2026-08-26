"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CreateItemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("create item error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-2xl font-semibold text-on-surface">
        Failed to load page
      </h2>
      <p className="mt-2 text-body-md text-on-surface-variant">
        Please try again.
      </p>
      <Button
        onClick={reset}
        className="mt-6 bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
      >
        Retry
      </Button>
    </div>
  );
}
