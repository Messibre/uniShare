"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, ShieldOff, Trash2, Users } from "lucide-react";
import {
  useAdminUsers,
  useVerifyUser,
  useAdminDeleteUser,
} from "@/lib/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";

type VerifiedFilter = "all" | "verified" | "pending";

const FILTERS: { value: VerifiedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
];

export function AdminUsersPanel() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VerifiedFilter>("all");

  // Debounce the search so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    isVerified: filter === "all" ? undefined : filter === "verified",
  });
  const verifyUser = useVerifyUser();
  const deleteUser = useAdminDeleteUser();

  const handleVerify = async (userId: string, verified: boolean) => {
    try {
      await verifyUser.mutateAsync({ userId, verified });
      toast.success(verified ? "User verified" : "User unverified");
    } catch {
      toast.error("Failed to update verification");
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      toast.success(`${name} removed`);
    } catch {
      toast.error("Failed to remove user");
    }
  };

  const users = data?.users ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <div
          className="inline-flex rounded-full border border-outline-variant bg-surface-container-low p-1"
          role="group"
          aria-label="Filter by verification status"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`rounded-full px-3 py-1 text-label-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-white"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
            <Users className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-body-md text-on-surface-variant">
            No users match your filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-[var(--shadow-level-1)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Rentals</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface">
                        {u.fullName}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        {u.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        u.role === "ADMIN"
                          ? "border-primary/30 text-primary"
                          : "border-outline-variant text-on-surface-variant"
                      }
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {u._count?.items ?? 0}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {u._count?.rentalsAsRenter ?? 0}
                  </TableCell>
                  <TableCell className="text-label-sm text-on-surface-variant">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    {u.isIdVerified ? (
                      <Badge className="border-green-500/20 bg-green-500/15 text-green-600">
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="border-yellow-500/20 bg-yellow-500/15 text-yellow-600">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-outline text-on-surface"
                        onClick={() => handleVerify(u.id, !u.isIdVerified)}
                        disabled={verifyUser.isPending}
                      >
                        {u.isIdVerified ? (
                          <>
                            <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
                            Unverify
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Verify
                          </>
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-on-surface-variant hover:text-red-600"
                            aria-label={`Remove ${u.fullName}`}
                            disabled={u.role === "ADMIN"}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove {u.fullName}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently deletes the user account and
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDelete(u.id, u.fullName)}
                            >
                              Remove user
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
