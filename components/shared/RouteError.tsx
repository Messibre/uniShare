"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
}

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  description = "We couldn't load this page. Check your connection and try again.",
  homeHref = "/items",
  homeLabel = "Browse items",
}: RouteErrorProps) {
  useEffect(() => {
    console.error("route error:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <AlertCircle
        className="h-12 w-12 text-on-surface-variant"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-h2 font-semibold text-on-surface">{title}</h2>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={reset}
          className="bg-primary-container text-on-primary-container hover:bg-primary-container/90"
        >
          Try again
        </Button>
        <Button
          variant="outline"
          render={<Link href={homeHref}>{homeLabel}</Link>}
          className="border-outline text-on-surface hover:bg-surface-container"
        />
      </div>
    </div>
  );
}
