import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  pricePerDay: number;
  deposit?: number;
  imageUrl?: string;
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "REMOVED";
  ownerType: "PLATFORM" | "USER";
  ownerId: string | null;
  owner?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ItemsResponse {
  items: Item[];
}

interface PaginatedItemsResponse extends ItemsResponse {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateItemData {
  name: string;
  description?: string;
  category: string;
  pricePerDay: number;
  deposit?: number;
  imageUrl?: string;
}

interface UpdateItemData extends Partial<CreateItemData> {
  status?: Item["status"];
}

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

export function useItems(
  filters?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    available?: boolean;
    page?: number;
    limit?: number;
  },
  options?: { initialData?: PaginatedItemsResponse },
) {
  return useQuery({
    queryKey: itemKeys.list(filters || {}),
    queryFn: async () => {
      const response = await apiClient<PaginatedItemsResponse>("/items", {
        params: filters as Record<string, string>,
      });
      return response;
    },
    initialData: options?.initialData,
    staleTime: 60 * 1000,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient<{ item: Item }>(`/items/${id}`);
      return response.item;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      const response = await apiClient<{ item: Item }>("/items", {
        method: "POST",
        body: data,
      });
      return response.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateItemData }) => {
      const response = await apiClient<{ item: Item }>(`/items/${id}`, {
        method: "PATCH",
        body: data,
      });
      return response.item;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient(`/items/${id}`, { method: "DELETE" });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}
