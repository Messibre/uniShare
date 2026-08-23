import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Rental {
  id: string;
  itemId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "ACTIVE"
    | "RETURNED"
    | "OVERDUE"
    | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  item?: Item;
  renter?: User;
  owner?: User;
  statusLogs?: StatusLog[];
  payments?: Payment[];
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Item {
  id: string;
  name: string;
  category: string;
  pricePerDay: number;
  imageUrl?: string;
}

interface StatusLog {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  note: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  type: string;
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

interface CreateRentalData {
  itemId: string;
  startDate: string;
  endDate: string;
}

interface UpdateStatusData {
  status: Rental["status"];
  note?: string;
}

export const rentalKeys = {
  all: ["rentals"] as const,
  lists: () => [...rentalKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...rentalKeys.lists(), filters] as const,
  details: () => [...rentalKeys.all, "detail"] as const,
  detail: (id: string) => [...rentalKeys.details(), id] as const,
};

export function useRentals(filters?: {
  status?: Rental["status"];
  startDate?: string;
  endDate?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: rentalKeys.list(filters || {}),
    queryFn: async () => {
      const response = await apiClient<PaginatedRentalsResponse>("/rentals", {
        params: filters as Record<string, string>,
      });
      return response;
    },
    staleTime: 30 * 1000,
  });
}

export function useRental(id: string) {
  return useQuery({
    queryKey: rentalKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient<{ rental: Rental }>(`/rentals/${id}`);
      return response.rental;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRentalData) => {
      const response = await apiClient<{ rental: Rental }>("/rentals", {
        method: "POST",
        body: data,
      });
      return response.rental;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
    },
  });
}

export function useUpdateRentalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStatusData;
    }) => {
      const response = await apiClient<{ rental: Rental }>(
        `/rentals/${id}/status`,
        {
          method: "PATCH",
          body: data,
        },
      );
      return response.rental;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
    },
  });
}
