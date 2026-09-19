import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import {
  useAdminStats,
  useAdminUsers,
  useVerifyUser,
  useAdminRentals,
  useCreatePlatformItem,
  useAdminDeleteUser,
  useAdminDeleteItem,
  adminKeys,
} from "@/lib/hooks/useAdmin";
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

const mockStats = {
  totalUsers: 150,
  totalRentals: 320,
  totalItems: 210,
  pendingRentals: 45,
  platformItems: 30,
};

const mockUsersPage = {
  users: [
    {
      id: "user-1",
      fullName: "Alice",
      email: "alice@test.com",
      role: "STUDENT",
      isIdVerified: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      _count: { items: 3, rentalsAsRenter: 5 },
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

const mockRentalsPage = {
  rentals: [
    {
      id: "rental-1",
      status: "PENDING",
      totalPrice: 500,
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-01-05T00:00:00.000Z",
      item: {
        id: "item-1",
        name: "Camera",
        owner: { id: "u2", fullName: "Owner" },
      },
      renter: { id: "u1", fullName: "Renter", email: "r@test.com" },
      owner: { id: "u2", fullName: "Owner", email: "o@test.com" },
      payments: [],
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

const mockItem = {
  id: "item-1",
  name: "Platform Camera",
  category: "Electronics",
  pricePerDay: 250,
  ownerType: "PLATFORM",
  ownerId: null,
  status: "AVAILABLE",
};

describe("useAdmin hooks", () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useAdminStats", () => {
    it("calls GET /admin", async () => {
      mockedApiClient.mockResolvedValueOnce({ stats: mockStats });

      const { result } = renderHookWithProviders(() => useAdminStats());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/admin");
    });

    it("returns the stats object", async () => {
      mockedApiClient.mockResolvedValueOnce({ stats: mockStats });

      const { result } = renderHookWithProviders(() => useAdminStats());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
    });

    it("uses adminKeys.stats() as the cache key", async () => {
      mockedApiClient.mockResolvedValueOnce({ stats: mockStats });

      const { queryClient } = renderHookWithProviders(() => useAdminStats());

      await waitFor(() =>
        expect(queryClient.getQueryData(adminKeys.stats())).toEqual(mockStats),
      );
    });
  });

  describe("useAdminUsers", () => {
    it("calls GET /admin/users with no params when filters are empty", async () => {
      mockedApiClient.mockResolvedValueOnce(mockUsersPage);

      const { result } = renderHookWithProviders(() => useAdminUsers());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/admin/users", {
        params: {},
      });
    });

    it("passes filters as query params", async () => {
      mockedApiClient.mockResolvedValueOnce(mockUsersPage);

      const filters = {
        search: "alice",
        isVerified: true,
        role: "STUDENT" as const,
        page: 2,
        limit: 10,
      };

      const { result } = renderHookWithProviders(() => useAdminUsers(filters));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/admin/users", {
        params: filters,
      });
    });

    it("returns users and pagination", async () => {
      mockedApiClient.mockResolvedValueOnce(mockUsersPage);

      const { result } = renderHookWithProviders(() => useAdminUsers());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.users).toHaveLength(1);
      expect(result.current.data?.pagination.total).toBe(1);
    });

    it("uses adminKeys.usersList(filters) as the cache key", async () => {
      mockedApiClient.mockResolvedValueOnce(mockUsersPage);

      const filters = { search: "alice" };
      const { queryClient } = renderHookWithProviders(() =>
        useAdminUsers(filters),
      );

      await waitFor(() =>
        expect(queryClient.getQueryData(adminKeys.usersList(filters))).toEqual(
          mockUsersPage,
        ),
      );
    });
  });

  describe("useVerifyUser", () => {
    it("calls PATCH /admin/users/{id}/verify with verified: true", async () => {
      mockedApiClient.mockResolvedValueOnce({
        user: { ...mockUsersPage.users[0] },
      });

      const { result } = renderHookWithProviders(() => useVerifyUser());

      await result.current.mutateAsync({ userId: "user-1", verified: true });

      expect(mockedApiClient).toHaveBeenCalledWith(
        "/admin/users/user-1/verify",
        {
          method: "PATCH",
          body: { verified: true },
        },
      );
    });

    it("sends verified: false when unverifying", async () => {
      mockedApiClient.mockResolvedValueOnce({
        user: { ...mockUsersPage.users[0], isIdVerified: false },
      });

      const { result } = renderHookWithProviders(() => useVerifyUser());

      await result.current.mutateAsync({ userId: "user-1", verified: false });

      expect(mockedApiClient).toHaveBeenCalledWith(
        "/admin/users/user-1/verify",
        {
          method: "PATCH",
          body: { verified: false },
        },
      );
    });

    it("invalidates users list and stats on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ user: mockUsersPage.users[0] });

      const { result, queryClient } = renderHookWithProviders(() =>
        useVerifyUser(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync({ userId: "user-1", verified: true });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: adminKeys.users(),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: adminKeys.stats(),
      });
    });

    it("propagates errors", async () => {
      mockedApiClient.mockRejectedValueOnce(new Error("User not found"));

      const { result } = renderHookWithProviders(() => useVerifyUser());

      await expect(
        result.current.mutateAsync({ userId: "missing", verified: true }),
      ).rejects.toThrow("User not found");
    });
  });

  describe("useAdminRentals", () => {
    it("calls GET /admin/rentals with no params when filters are empty", async () => {
      mockedApiClient.mockResolvedValueOnce(mockRentalsPage);

      const { result } = renderHookWithProviders(() => useAdminRentals());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/admin/rentals", {
        params: {},
      });
    });

    it("passes filters as query params", async () => {
      mockedApiClient.mockResolvedValueOnce(mockRentalsPage);

      const filters = {
        status: "PENDING",
        userId: "user-1",
        page: 1,
        limit: 10,
      };
      const { result } = renderHookWithProviders(() =>
        useAdminRentals(filters),
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/admin/rentals", {
        params: filters,
      });
    });

    it("returns rentals and pagination", async () => {
      mockedApiClient.mockResolvedValueOnce(mockRentalsPage);

      const { result } = renderHookWithProviders(() => useAdminRentals());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.rentals).toHaveLength(1);
      expect(result.current.data?.pagination.total).toBe(1);
    });
  });

  describe("useCreatePlatformItem", () => {
    it("calls POST /admin/items with item data", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { result } = renderHookWithProviders(() => useCreatePlatformItem());

      await result.current.mutateAsync({
        name: "Platform Camera",
        category: "Electronics",
        pricePerDay: 250,
        deposit: 1000,
        description: "High quality",
        imageUrl: "https://example.com/img.jpg",
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/admin/items", {
        method: "POST",
        body: {
          name: "Platform Camera",
          category: "Electronics",
          pricePerDay: 250,
          deposit: 1000,
          description: "High quality",
          imageUrl: "https://example.com/img.jpg",
        },
      });
    });

    it("returns the created item", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { result } = renderHookWithProviders(() => useCreatePlatformItem());

      const created = await result.current.mutateAsync({
        name: "Platform Camera",
        category: "Electronics",
        pricePerDay: 250,
      });

      expect(created).toEqual(mockItem);
    });

    it("invalidates stats and items list on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ item: mockItem });

      const { result, queryClient } = renderHookWithProviders(() =>
        useCreatePlatformItem(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync({
        name: "Platform Camera",
        category: "Electronics",
        pricePerDay: 250,
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: adminKeys.stats(),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["items", "list"],
      });
    });

    it("propagates errors", async () => {
      mockedApiClient.mockRejectedValueOnce(new Error("Validation failed"));

      const { result } = renderHookWithProviders(() => useCreatePlatformItem());

      await expect(
        result.current.mutateAsync({ name: "", category: "", pricePerDay: 0 }),
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("useAdminDeleteUser", () => {
    it("calls DELETE /admin/users/{id}", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "User deleted" });

      const { result } = renderHookWithProviders(() => useAdminDeleteUser());

      await result.current.mutateAsync("user-1");

      expect(mockedApiClient).toHaveBeenCalledWith("/admin/users/user-1", {
        method: "DELETE",
      });
    });

    it("invalidates users and stats on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "User deleted" });

      const { result, queryClient } = renderHookWithProviders(() =>
        useAdminDeleteUser(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync("user-1");

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: adminKeys.users(),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: adminKeys.stats(),
      });
    });

    it("propagates errors", async () => {
      mockedApiClient.mockRejectedValueOnce(
        new Error("Cannot delete yourself"),
      );

      const { result } = renderHookWithProviders(() => useAdminDeleteUser());

      await expect(result.current.mutateAsync("self")).rejects.toThrow(
        "Cannot delete yourself",
      );
    });
  });

  describe("useAdminDeleteItem", () => {
    it("calls DELETE /admin/items/{id}", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "Item removed" });

      const { result } = renderHookWithProviders(() => useAdminDeleteItem());

      await result.current.mutateAsync("item-1");

      expect(mockedApiClient).toHaveBeenCalledWith("/admin/items/item-1", {
        method: "DELETE",
      });
    });

    it("invalidates stats and items list on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "Item removed" });

      const { result, queryClient } = renderHookWithProviders(() =>
        useAdminDeleteItem(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync("item-1");

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: adminKeys.stats(),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["items", "list"],
      });
    });

    it("propagates errors", async () => {
      mockedApiClient.mockRejectedValueOnce(new Error("Item not found"));

      const { result } = renderHookWithProviders(() => useAdminDeleteItem());

      await expect(result.current.mutateAsync("missing")).rejects.toThrow(
        "Item not found",
      );
    });
  });
});
