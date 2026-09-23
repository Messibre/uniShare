"use client";

import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAdminStats } from "@/lib/hooks/useAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStatsGrid } from "@/components/admin/AdminStatsGrid";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { AdminRentalsPanel } from "@/components/admin/AdminRentalsPanel";
import { PlatformItemForm } from "@/components/admin/PlatformItemForm";

export default function AdminPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-600">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="text-h2 font-semibold text-on-surface">Access denied</h2>
        <p className="max-w-sm text-body-md text-on-surface-variant">
          You need administrator privileges to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-label-sm font-medium text-on-surface-variant">
          Administrator
        </span>
        <h1 className="text-h2 font-semibold text-on-surface">
          Admin dashboard
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Manage users, monitor rentals, and maintain the platform catalog.
        </p>
      </header>

      <AdminStatsGrid stats={stats} isLoading={statsLoading} />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-surface-container-low">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="rentals">Rentals</TabsTrigger>
          <TabsTrigger value="platform">Platform items</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <AdminUsersPanel />
        </TabsContent>

        <TabsContent value="rentals" className="mt-6">
          <AdminRentalsPanel />
        </TabsContent>

        <TabsContent value="platform" className="mt-6">
          <PlatformItemForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
