import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import {
  useRentals,
  useRental,
  useCreateRental,
  useUpdateRentalStatus,
  rentalKeys,
} from "@/lib/hooks/useRentals";
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

const mockRental = {
  id: "rental-1",
  itemId: "item-1",
  renterId: "user-1",
  ownerId: "user-2",
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: "2026-01-05T00:00:00.000Z",
  totalPrice: 500,
  status: "PENDING" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockPaginated = {
  rentals: [mockRental],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

describe("useRentals hooks", () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useRentals", () => {
    it("calls /rentals with no params when filters are empty", async () => {
      mockedApiClient.mockResolvedValueOnce(mockPaginated);

      const { result } = renderHookWithProviders(() => useRentals());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/rentals", {
        params: {},
      });
    });

    it("passes filters as query params", async () => {
      mockedApiClient.mockResolvedValueOnce(mockPaginated);

      const { result } = renderHookWithProviders(() =>
        useRentals({
          status: "ACTIVE",
          page: 2,
          limit: 5,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/rentals", {
        params: {
          status: "ACTIVE",
          page: 2,
          limit: 5,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });
    });

    it("returns rentals and pagination data", async () => {
      mockedApiClient.mockResolvedValueOnce(mockPaginated);

      const { result } = renderHookWithProviders(() => useRentals());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.rentals).toHaveLength(1);
      expect(result.current.data?.pagination.total).toBe(1);
    });

    it("uses a query key that includes the filters", async () => {
      mockedApiClient.mockResolvedValueOnce(mockPaginated);

      const filters = { status: "PENDING" as const, page: 1 };
      const { queryClient } = renderHookWithProviders(() =>
        useRentals(filters),
      );

      await waitFor(() =>
        expect(queryClient.getQueryData(rentalKeys.list(filters))).toEqual(
          mockPaginated,
        ),
      );
    });
  });

  describe("useRental", () => {
    it("calls /rentals/{id}", async () => {
      mockedApiClient.mockResolvedValueOnce({ rental: mockRental });

      const { result } = renderHookWithProviders(() => useRental("rental-1"));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/rentals/rental-1");
      expect(result.current.data).toEqual(mockRental);
    });

    it("is disabled when id is empty", () => {
      const { result } = renderHookWithProviders(() => useRental(""));

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedApiClient).not.toHaveBeenCalled();
    });

    it("uses rentalKeys.detail(id) as the cache key", async () => {
      mockedApiClient.mockResolvedValueOnce({ rental: mockRental });

      const { queryClient } = renderHookWithProviders(() =>
        useRental("rental-1"),
      );

      await waitFor(() =>
        expect(queryClient.getQueryData(rentalKeys.detail("rental-1"))).toEqual(
          mockRental,
        ),
      );
    });
  });

  describe("useCreateRental", () => {
    it("calls POST /rentals with itemId and dates", async () => {
      mockedApiClient.mockResolvedValueOnce({ rental: mockRental });

      const { result } = renderHookWithProviders(() => useCreateRental());

      await result.current.mutateAsync({
        itemId: "item-1",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-05T00:00:00.000Z",
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/rentals", {
        method: "POST",
        body: {
          itemId: "item-1",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-01-05T00:00:00.000Z",
        },
      });
    });

    it("returns the created rental", async () => {
      mockedApiClient.mockResolvedValueOnce({ rental: mockRental });

      const { result } = renderHookWithProviders(() => useCreateRental());

      const created = await result.current.mutateAsync({
        itemId: "item-1",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-05T00:00:00.000Z",
      });

      expect(created).toEqual(mockRental);
    });

    it("invalidates rentalKeys.lists() on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ rental: mockRental });

      const { result, queryClient } = renderHookWithProviders(() =>
        useCreateRental(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync({
        itemId: "item-1",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-05T00:00:00.000Z",
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: rentalKeys.lists(),
      });
    });

    it("propagates errors", async () => {
      mockedApiClient.mockRejectedValueOnce(
        new Error("Item is already booked"),
      );

      const { result } = renderHookWithProviders(() => useCreateRental());

      await expect(
        result.current.mutateAsync({
          itemId: "item-1",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-01-05T00:00:00.000Z",
        }),
      ).rejects.toThrow("Item is already booked");
    });
  });

  describe("useUpdateRentalStatus", () => {
    it("calls PATCH /rentals/{id}/status with the new status", async () => {
      mockedApiClient.mockResolvedValueOnce({
        rental: { ...mockRental, status: "CONFIRMED" },
      });

      const { result } = renderHookWithProviders(() => useUpdateRentalStatus());

      await result.current.mutateAsync({
        id: "rental-1",
        data: { status: "CONFIRMED", note: "Confirmed by owner" },
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/rentals/rental-1/status", {
        method: "PATCH",
        body: { status: "CONFIRMED", note: "Confirmed by owner" },
      });
    });

    it("returns the updated rental", async () => {
      const updated = { ...mockRental, status: "CONFIRMED" as const };
      mockedApiClient.mockResolvedValueOnce({ rental: updated });

      const { result } = renderHookWithProviders(() => useUpdateRentalStatus());

      const response = await result.current.mutateAsync({
        id: "rental-1",
        data: { status: "CONFIRMED" },
      });

      expect(response.status).toBe("CONFIRMED");
    });

    it("invalidates both the detail and the list on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ rental: mockRental });

      const { result, queryClient } = renderHookWithProviders(() =>
        useUpdateRentalStatus(),
      );
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync({
        id: "rental-1",
        data: { status: "ACTIVE" },
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: rentalKeys.detail("rental-1"),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: rentalKeys.lists(),
      });
    });

    it("propagates errors", async () => {
      mockedApiClient.mockRejectedValueOnce(
        new Error("Invalid status transition"),
      );

      const { result } = renderHookWithProviders(() => useUpdateRentalStatus());

      await expect(
        result.current.mutateAsync({
          id: "rental-1",
          data: { status: "RETURNED" },
        }),
      ).rejects.toThrow("Invalid status transition");
    });
  });
});
