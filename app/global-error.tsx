"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="text-6xl font-bold text-primary">😥</h1>
          <h2 className="mt-4 text-2xl font-semibold text-on-surface">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
            We're sorry, but something unexpected happened.
          </p>
          <Button
            onClick={reset}
            className="mt-6 bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
          >
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
