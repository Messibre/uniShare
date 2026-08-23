import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  isIdVerified: boolean;
  createdAt: string;
  _count?: { items: number; rentalsAsRenter: number };
}

interface Rental {
  id: string;
  status: string;
  totalPrice: number;
  item: { id: string; name: string; owner: { id: string; fullName: string } };
  renter: { id: string; fullName: string; email: string };
  owner: { id: string; fullName: string; email: string };
  payments: any[];
}

interface AdminStats {
  stats: {
    totalUsers: number;
    totalRentals: number;
    totalItems: number;
    pendingRentals: number;
    platformItems: number;
  };
}

interface PaginatedUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaginatedRentalsResponse {
  rentals: Rental[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  usersList: (filters?: Record<string, any>) =>
    [...adminKeys.users(), filters] as const,
  rentals: () => [...adminKeys.all, "rentals"] as const,
  rentalsList: (filters?: Record<string, any>) =>
    [...adminKeys.rentals(), filters] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const response = await apiClient<AdminStats>("/admin");
      return response.stats;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminUsers(filters?: {
  search?: string;
  isVerified?: boolean;
  role?: "STUDENT" | "ADMIN";
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminKeys.usersList(filters || {}),
    queryFn: async () => {
      const response = await apiClient<PaginatedUsersResponse>("/admin/users", {
        params: filters as Record<
          string,
          string | number | boolean | undefined
        >,
      });
      return response;
    },
    staleTime: 60 * 1000,
  });
}

export function useVerifyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      verified,
    }: {
      userId: string;
      verified: boolean;
    }) => {
      const response = await apiClient<{ user: User }>(
        `/admin/users/${userId}/verify`,
        {
          method: "PATCH",
          body: { verified },
        },
      );
      return response.user;
    },
    onSuccess: () => {
      // Invalidate all user lists so the verification status updates instantly
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      // Also invalidate stats because verification status affects totals
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useAdminRentals(filters?: {
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminKeys.rentalsList(filters || {}),
    queryFn: async () => {
      const response = await apiClient<PaginatedRentalsResponse>(
        "/admin/rentals",
        {
          params: filters as Record<string, string | number | undefined>,
        },
      );
      return response;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreatePlatformItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: string;
      pricePerDay: number;
      deposit?: number;
      imageUrl?: string;
    }) => {
      const response = await apiClient<{ item: any }>("/admin/items", {
        method: "POST",
        body: data,
      });
      return response.item;
    },
    onSuccess: () => {
      // Invalidate admin stats (platformItems count)
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      // Invalidate the regular items list so the new platform item appears
      queryClient.invalidateQueries({ queryKey: ["items", "list"] });
    },
  });
}
