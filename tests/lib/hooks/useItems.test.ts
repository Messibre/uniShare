import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import {
  useItems,
  useItem,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  itemKeys,
} from "@/lib/hooks/useItems";
import { renderHookWithProviders } from "@/tests/helpers/render";

vi.mock("@/lib/api-client", () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

import { apiClient } from "@/lib/api-client";
const mockedApiClient = vi.mocked(apiClient);

const mockItem = {
  id: "item-1",
  name: "Canon EOS 2000D",
  description: "Great for events",
  category: "Electronics",
  pricePerDay: 250,
  deposit: 1000,
  imageUrl: "https://example.com/img.jpg",
  status: "AVAILABLE" as const,
  ownerType: "EndUser" as const,
  ownerId: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockPaginated = {
  items: [mockItem],
  pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
};

describe("useItems hooks", () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useItems", () => {
    it("calls /items with no params when filters are empty", async () => {
      mockedApiClient.mockResolvedValueOnce(mockPaginated);

      const { result } = renderHookWithProviders(() => useItems());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/items", {
        params: {},
      });
    });

    it("passes all filters as query params", async () => {
      mockedApiClient.mockResolvedValueOnce(mockPaginated);

      const filters = {
        search: "camera",
        category: "Electronics",
        minPrice: 100,
        maxPrice: 500,
        available: true,
        page: 2,
        limit: 12,
      };

      const { result } = renderHookWithProviders(() => useItems(filters));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/items", {
        params: filters,
      });
    });

    it("returns items and pagination", async () => {
      mockedApiClient.mockResolvedValueOnce(mockPaginated);

      const { result } = renderHookWithProviders(() => useItems());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.pagination.total).toBe(1);
    });

    it("uses itemKeys.list(filters) as the cache key", async () => {
      mockedApiClient.mockResolvedValueOnce(mockPaginated);

      const filters = { search: "camera", page: 1 };
      const { queryClient } = renderHookWithProviders(() => useItems(filters));

      await waitFor(() =>
        expect(queryClient.getQueryData(itemKeys.list(filters))).toEqual(
          mockPaginated,
        ),
      );
    });

    it("uses initialData to seed the cache immediately", async () => {
      const { result, queryClient } = renderHookWithProviders(() =>
        useItems({ page: 1 }, { initialData: mockPaginated }),
      );

      expect(result.current.data).toEqual(mockPaginated);
      expect(queryClient.getQueryData(itemKeys.list({ page: 1 }))).toEqual(
        mockPaginated,
      );
    });

    it("propagates errors", async () => {
      mockedApiClient.mockRejectedValueOnce(new Error("Internal server error"));

      const { result } = renderHookWithProviders(() => useItems());

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal server error");
    });
  });

  describe("useItem", () => {
    it("calls /items/{id}", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { result } = renderHookWithProviders(() => useItem("item-1"));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/items/item-1");
      expect(result.current.data).toEqual(mockItem);
    });

    it("is disabled when id is empty", () => {
      const { result } = renderHookWithProviders(() => useItem(""));

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedApiClient).not.toHaveBeenCalled();
    });

    it("uses itemKeys.detail(id) as the cache key", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { queryClient } = renderHookWithProviders(() => useItem("item-1"));

      await waitFor(() =>
        expect(queryClient.getQueryData(itemKeys.detail("item-1"))).toEqual(
          mockItem,
        ),
      );
    });

    it("propagates 404 errors", async () => {
      mockedApiClient.mockRejectedValueOnce(new Error("Item not found"));

      const { result } = renderHookWithProviders(() => useItem("missing"));

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Item not found");
    });
  });

  describe("useCreateItem", () => {
    it("calls POST /items with item data", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { result } = renderHookWithProviders(() => useCreateItem());

      await result.current.mutateAsync({
        name: "Canon EOS 2000D",
        description: "Great for events",
        category: "Electronics",
        pricePerDay: 250,
        deposit: 1000,
        imageUrl: "https://example.com/img.jpg",
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/items", {
        method: "POST",
        body: {
          name: "Canon EOS 2000D",
          description: "Great for events",
          category: "Electronics",
          pricePerDay: 250,
          deposit: 1000,
          imageUrl: "https://example.com/img.jpg",
        },
      });
    });

    it("returns the created item", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { result } = renderHookWithProviders(() => useCreateItem());

      const created = await result.current.mutateAsync({
        name: "Canon EOS 2000D",
        category: "Electronics",
        pricePerDay: 250,
      });

      expect(created).toEqual(mockItem);
    });

    it("invalidates itemKeys.lists() on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { result, queryClient } = renderHookWithProviders(() =>
        useCreateItem(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync({
        name: "Canon EOS 2000D",
        category: "Electronics",
        pricePerDay: 250,
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: itemKeys.lists(),
      });
    });

    it("propagates validation errors", async () => {
      mockedApiClient.mockRejectedValueOnce(new Error("Validation failed"));

      const { result } = renderHookWithProviders(() => useCreateItem());

      await expect(
        result.current.mutateAsync({ name: "", category: "", pricePerDay: -1 }),
      ).rejects.toThrow("Validation failed");
    });

    it("propagates 403 when user is not verified", async () => {
      mockedApiClient.mockRejectedValueOnce(
        new Error("Must verify your ID before listing items"),
      );

      const { result } = renderHookWithProviders(() => useCreateItem());

      await expect(
        result.current.mutateAsync({
          name: "Item",
          category: "Electronics",
          pricePerDay: 100,
        }),
      ).rejects.toThrow("Must verify your ID before listing items");
    });
  });

  describe("useUpdateItem", () => {
    it("calls PATCH /items/{id} with update data", async () => {
      mockedApiClient.mockResolvedValueOnce({
        item: { ...mockItem, pricePerDay: 300 },
      });

      const { result } = renderHookWithProviders(() => useUpdateItem());

      await result.current.mutateAsync({
        id: "item-1",
        data: { pricePerDay: 300, status: "MAINTENANCE" },
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/items/item-1", {
        method: "PATCH",
        body: { pricePerDay: 300, status: "MAINTENANCE" },
      });
    });

    it("returns the updated item", async () => {
      const updated = { ...mockItem, pricePerDay: 300 };
      mockedApiClient.mockResolvedValueOnce({ item: updated });

      const { result } = renderHookWithProviders(() => useUpdateItem());

      const response = await result.current.mutateAsync({
        id: "item-1",
        data: { pricePerDay: 300 },
      });

      expect(response.pricePerDay).toBe(300);
    });

    it("invalidates both the detail and the list on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { result, queryClient } = renderHookWithProviders(() =>
        useUpdateItem(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync({
        id: "item-1",
        data: { name: "Updated" },
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: itemKeys.detail("item-1"),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: itemKeys.lists(),
      });
    });

    it("propagates 403 when user is not owner or admin", async () => {
      mockedApiClient.mockRejectedValueOnce(
        new Error("Not authorized to edit this item"),
      );

      const { result } = renderHookWithProviders(() => useUpdateItem());

      await expect(
        result.current.mutateAsync({ id: "item-1", data: { name: "Hacked" } }),
      ).rejects.toThrow("Not authorized to edit this item");
    });
  });

  describe("useDeleteItem", () => {
    it("calls DELETE /items/{id}", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "Item removed" });

      const { result } = renderHookWithProviders(() => useDeleteItem());

      await result.current.mutateAsync("item-1");

      expect(mockedApiClient).toHaveBeenCalledWith("/items/item-1", {
        method: "DELETE",
      });
    });

    it("invalidates detail and lists on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "Item removed" });

      const { result, queryClient } = renderHookWithProviders(() =>
        useDeleteItem(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync("item-1");

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: itemKeys.detail("item-1"),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: itemKeys.lists(),
      });
    });

    it("propagates 403 when user is not owner or admin", async () => {
      mockedApiClient.mockRejectedValueOnce(
        new Error("Not authorized to delete this item"),
      );

      const { result } = renderHookWithProviders(() => useDeleteItem());

      await expect(result.current.mutateAsync("item-1")).rejects.toThrow(
        "Not authorized to delete this item",
      );
    });
  });
});
