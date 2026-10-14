"use client";

import { RouteError } from "@/components/shared/RouteError";

export default function AuthError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} title="We couldn't load this page" />;
}
