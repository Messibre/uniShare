"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ROUTES } from "@/lib/utils/constants";
import { PageLoader } from "@/components/shared/PageLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("STUDENT" | "ADMIN")[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (!isLoading && isAuthenticated && user && allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        router.replace(ROUTES.DASHBOARD);
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <PageLoader />; // Or a "Access Denied" component
  }

  return <>{children}</>;
}
