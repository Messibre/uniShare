"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ROUTES } from "@/lib/utils/constants";
import { PageLoader } from "@/components/shared/PageLoader";

interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Protects public routes (login, register) from authenticated users.
 * Redirects to dashboard if the user is already logged in.
 */
export function GuestRoute({
  children,
  redirectTo = ROUTES.DASHBOARD,
}: GuestRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // If loading is complete and user is authenticated, redirect to dashboard
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  // If user is not authenticated, render children (the public page)
  return <>{children}</>;
}
