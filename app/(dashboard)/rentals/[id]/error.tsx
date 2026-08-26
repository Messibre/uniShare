"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RentalDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Rental detail error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-2xl font-semibold text-on-surface">
        Failed to load rental
      </h2>
      <p className="mt-2 text-body-md text-on-surface-variant">
        We couldn't load the rental details. Please try again.
      </p>
      <div className="mt-6 flex gap-4">
        <Button
          onClick={reset}
          className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
        >
          Retry
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-outline text-on-surface hover:bg-surface-container"
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
