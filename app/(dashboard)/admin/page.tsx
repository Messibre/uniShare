"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  useAdminStats,
  useAdminUsers,
  useAdminRentals,
  useVerifyUser,
  useCreatePlatformItem,
} from "@/lib/hooks/useAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { ITEM_CATEGORIES } from "@/lib/utils/constants";

export default function AdminPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useAdminUsers({ search: searchTerm || undefined });
  const { data: rentalsData, isLoading: rentalsLoading } = useAdminRentals({
    limit: 20,
  });
  const verifyUser = useVerifyUser();

  // Platform Item form state
  const [platformItem, setPlatformItem] = useState({
    name: "",
    description: "",
    category: "",
    pricePerDay: "",
    deposit: "",
    imageUrl: "",
  });
  const createPlatformItem = useCreatePlatformItem();

  if (user?.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <h2 className="text-h2 font-h2 text-on-surface">Access Denied</h2>
        <p className="text-body-md text-on-surface-variant">
          You need administrator privileges to view this page.
        </p>
      </div>
    );
  }

  const handleVerify = async (userId: string, verified: boolean) => {
    try {
      await verifyUser.mutateAsync({ userId, verified });
      toast.success(
        `User ${verified ? "verified" : "unverified"} successfully`,
      );
      refetchUsers();
    } catch (error) {
      toast.error("Failed to update user verification");
    }
  };

  const handleCreatePlatformItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlatformItem.mutateAsync({
        name: platformItem.name,
        description: platformItem.description,
        category: platformItem.category,
        pricePerDay: parseFloat(platformItem.pricePerDay),
        deposit: platformItem.deposit ? parseFloat(platformItem.deposit) : 0,
        imageUrl: platformItem.imageUrl,
      });
      toast.success("✅ Platform item created successfully!");
      setPlatformItem({
        name: "",
        description: "",
        category: "",
        pricePerDay: "",
        deposit: "",
        imageUrl: "",
      });
    } catch (error) {
      toast.error("Failed to create platform item");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-h2 text-on-surface">Admin Dashboard</h1>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="bg-surface-container-low">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="rentals">Rentals</TabsTrigger>
          <TabsTrigger value="platform">Platform Items</TabsTrigger>
        </TabsList>

        {/* Stats Tab — unchanged */}
        <TabsContent value="stats" className="mt-6">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-surface border-outline-variant">
                <CardContent className="p-4">
                  <p className="text-label-sm text-on-surface-variant">
                    Total Users
                  </p>
                  <p className="text-h2 font-h2 text-on-surface">
                    {stats?.totalUsers || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-outline-variant">
                <CardContent className="p-4">
                  <p className="text-label-sm text-on-surface-variant">
                    Total Rentals
                  </p>
                  <p className="text-h2 font-h2 text-on-surface">
                    {stats?.totalRentals || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-outline-variant">
                <CardContent className="p-4">
                  <p className="text-label-sm text-on-surface-variant">
                    Total Items
                  </p>
                  <p className="text-h2 font-h2 text-on-surface">
                    {stats?.totalItems || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-outline-variant">
                <CardContent className="p-4">
                  <p className="text-label-sm text-on-surface-variant">
                    Pending Rentals
                  </p>
                  <p className="text-h2 font-h2 text-primary">
                    {stats?.pendingRentals || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Users Tab — unchanged */}
        <TabsContent value="users" className="mt-6">
          <div className="mb-4 flex items-center gap-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {usersLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.fullName}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {u.isIdVerified ? (
                          <Badge className="bg-green-500/15 text-green-600 border-green-500/20">
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/20">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={u.isIdVerified ? "outline" : "default"}
                          className={
                            u.isIdVerified
                              ? "border-outline text-on-surface"
                              : "bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
                          }
                          onClick={() => handleVerify(u.id, !u.isIdVerified)}
                          disabled={verifyUser.isPending}
                        >
                          {u.isIdVerified ? "Unverify" : "Verify"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Rentals Tab — unchanged */}
        <TabsContent value="rentals" className="mt-6">
          {rentalsLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Renter</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Dates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentalsData?.rentals?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.item?.name || "Unknown"}
                      </TableCell>
                      <TableCell>{r.renter?.fullName || "Unknown"}</TableCell>
                      <TableCell>{r.owner?.fullName || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge
                          className={`bg-${r.status === "PENDING" ? "yellow" : r.status === "CONFIRMED" ? "blue" : r.status === "ACTIVE" ? "green" : "gray"}-500/15 text-${r.status === "PENDING" ? "yellow" : r.status === "CONFIRMED" ? "blue" : r.status === "ACTIVE" ? "green" : "gray"}-600 border-${r.status === "PENDING" ? "yellow" : r.status === "CONFIRMED" ? "blue" : r.status === "ACTIVE" ? "green" : "gray"}-500/20`}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(r.totalPrice)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.startDate)} → {formatDate(r.endDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ✅ NEW: Platform Items Tab */}
        <TabsContent value="platform" className="mt-6">
          <Card className="bg-surface border-outline-variant max-w-2xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-h3 font-h3 text-on-surface">
                Create Platform Item
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                These items are owned by the platform (e.g., calculators,
                cameras). They are available for all verified students to rent.
              </p>
              <form onSubmit={handleCreatePlatformItem} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="platform-name">Item Name</Label>
                  <Input
                    id="platform-name"
                    placeholder="e.g., Canon EOS 2000D Camera"
                    value={platformItem.name}
                    onChange={(e) =>
                      setPlatformItem((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="platform-category">Category</Label>
                  <Select
                    onValueChange={(value) =>
                      setPlatformItem((prev) => ({
                        ...prev,
                        category: value ?? "",
                      }))
                    }
                    value={platformItem.category || ""}
                  >
                    <SelectTrigger id="platform-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="platform-description">Description</Label>
                  <Textarea
                    id="platform-description"
                    placeholder="Describe the item's condition, included accessories..."
                    className="resize-y min-h-[80px]"
                    value={platformItem.description}
                    onChange={(e) =>
                      setPlatformItem((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="platform-price">Price per Day ($)</Label>
                    <Input
                      id="platform-price"
                      type="number"
                      step="0.50"
                      placeholder="250"
                      value={platformItem.pricePerDay}
                      onChange={(e) =>
                        setPlatformItem((prev) => ({
                          ...prev,
                          pricePerDay: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="platform-deposit">Deposit ($)</Label>
                    <Input
                      id="platform-deposit"
                      type="number"
                      step="5"
                      placeholder="1000"
                      value={platformItem.deposit}
                      onChange={(e) =>
                        setPlatformItem((prev) => ({
                          ...prev,
                          deposit: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="platform-image">Image URL</Label>
                  <Input
                    id="platform-image"
                    placeholder="https://example.com/image.jpg"
                    value={platformItem.imageUrl}
                    onChange={(e) =>
                      setPlatformItem((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createPlatformItem.isPending}
                  className="w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-white"
                >
                  {createPlatformItem.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Platform Item"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
