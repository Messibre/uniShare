"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRentals } from "@/lib/hooks/useRentals";
import { useItems } from "@/lib/hooks/useItems";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: rentalsData, isLoading: rentalsLoading } = useRentals({
    limit: 20,
  });
  const { data: itemsData, isLoading: itemsLoading } = useItems({ limit: 20 });

  const rentals = rentalsData?.rentals || [];
  const ownedItems = itemsData?.items || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
      CONFIRMED: "bg-blue-500/15 text-blue-600 border-blue-500/20",
      ACTIVE: "bg-green-500/15 text-green-600 border-green-500/20",
      RETURNED: "bg-gray-500/15 text-gray-600 border-gray-500/20",
      OVERDUE: "bg-red-500/15 text-red-600 border-red-500/20",
      CANCELLED: "bg-red-500/15 text-red-600 border-red-500/20",
    };
    return colors[status] || "bg-gray-500/15 text-gray-600 border-gray-500/20";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 font-h2 text-on-surface">Dashboard</h1>
          <p className="text-body-sm text-on-surface-variant">
            Welcome back, {user?.fullName || "User"}!
          </p>
        </div>
        <Button
          render={
            <Link href={ROUTES.CREATE_ITEM}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          }
          className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
        ></Button>
      </div>

      <Tabs defaultValue="renter" className="w-full">
        <TabsList className="grid w-full max-w-[10rem] grid-cols-2 bg-surface-container-low">
          <TabsTrigger value="renter">As Renter</TabsTrigger>
          <TabsTrigger value="owner">As Owner</TabsTrigger>
        </TabsList>

        {/* RENTER TAB */}
        <TabsContent value="renter" className="space-y-4 mt-6">
          {rentalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : rentals.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-xl border border-outline-variant">
              <p className="text-body-lg text-on-surface-variant">
                No rentals yet.
              </p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Browse items and start renting!
              </p>
              <Button
                render={<Link href={ROUTES.ITEMS}>Browse Items</Link>}
                className="mt-4 bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
              ></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rentals.map((rental) => (
                <Card
                  key={rental.id}
                  className="bg-surface border border-outline-variant hover:shadow-[--shadow-level-2] transition-shadow"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-body-md font-semibold text-on-surface">
                          {rental.item?.name || "Unknown Item"}
                        </h3>
                        <p className="text-label-sm text-on-surface-variant">
                          {formatDate(rental.startDate)} →{" "}
                          {formatDate(rental.endDate)}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(rental.status)} text-label-sm font-medium border`}
                      >
                        {rental.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-outline-variant">
                      <span className="text-body-lg font-semibold text-primary">
                        {formatCurrency(rental.totalPrice)}
                      </span>
                      {rental.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* OWNER TAB */}
        <TabsContent value="owner" className="space-y-4 mt-6">
          {itemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : ownedItems.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-xl border border-outline-variant">
              <p className="text-body-lg text-on-surface-variant">
                You haven't listed any items yet.
              </p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Start earning by listing your gear!
              </p>
              <Button
                render={<Link href={ROUTES.CREATE_ITEM}>List an Item</Link>}
                className="mt-4 bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
              ></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ownedItems.map((item) => (
                <Card
                  key={item.id}
                  className="bg-surface border border-outline-variant hover:shadow-[--shadow-level-2] transition-shadow"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-body-md font-semibold text-on-surface">
                        {item.name}
                      </h3>
                      <Badge
                        className={`${item.status === "AVAILABLE" ? "bg-green-500/15 text-green-600 border-green-500/20" : "bg-gray-500/15 text-gray-600 border-gray-500/20"}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-label-sm text-on-surface-variant line-clamp-1">
                      {item.category}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-outline-variant">
                      <span className="text-body-lg font-semibold text-primary">
                        {formatCurrency(item.pricePerDay)}/day
                      </span>
                      <Button
                        render={<Link href={`/items/${item.id}`}>View</Link>}
                        variant="outline"
                        size="sm"
                        className="border-outline-variant text-on-surface hover:bg-surface-container"
                      ></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
