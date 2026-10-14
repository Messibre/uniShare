"use client";

import { RouteError } from "@/components/shared/RouteError";

export default function SettingsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Settings couldn't load"
      homeHref="/dashboard"
      homeLabel="Go to dashboard"
    />
  );
}
