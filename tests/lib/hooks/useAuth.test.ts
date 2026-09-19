// tests/lib/hooks/useAuth.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import {
  useUser,
  useLogin,
  useRegister,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useUpdateProfile,
  useDeleteAccount,
  useChangePassword,
  authKeys,
} from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  renderHookWithProviders,
  resetAuthStore,
} from "@/tests/helpers/render";

// ────────────────────────────────────────────────────────────
// Mock apiClient
// ────────────────────────────────────────────────────────────
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

// Import AFTER the mock so we get the mocked version
import { apiClient } from "@/lib/api-client";
const mockedApiClient = vi.mocked(apiClient);

// ────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────
const mockUser = {
  id: "user-1",
  fullName: "Test User",
  email: "test@test.com",
  phone: "+251900000000",
  role: "STUDENT" as const,
  isIdVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("useAuth hooks", () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
    resetAuthStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // 1. useUser
  // ────────────────────────────────────────────────────────────
  describe("useUser", () => {
    it("fetches /auth/me and updates the auth store", async () => {
      mockedApiClient.mockResolvedValueOnce({ user: mockUser });

      const { result } = renderHookWithProviders(() => useUser());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/me");
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("clears the user on 401", async () => {
      mockedApiClient.mockRejectedValueOnce(new Error("Unauthorized"));

      const { result } = renderHookWithProviders(() => useUser());

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("uses the correct query key", async () => {
      mockedApiClient.mockResolvedValueOnce({ user: mockUser });

      const { queryClient } = renderHookWithProviders(() => useUser());

      await waitFor(() =>
        expect(queryClient.getQueryData(authKeys.me)).toEqual(mockUser),
      );
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. useLogin
  // ────────────────────────────────────────────────────────────
  describe("useLogin", () => {
    it("calls /auth/login with credentials", async () => {
      mockedApiClient.mockResolvedValueOnce({ success: true, user: mockUser });

      const { result } = renderHookWithProviders(() => useLogin());

      await result.current.mutateAsync({
        email: "test@test.com",
        password: "password123",
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/login", {
        method: "POST",
        body: { email: "test@test.com", password: "password123" },
      });
    });

    it("sets the user in Zustand on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ success: true, user: mockUser });

      const { result } = renderHookWithProviders(() => useLogin());

      await result.current.mutateAsync({
        email: "test@test.com",
        password: "password123",
      });

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("seeds the auth.me cache with the logged-in user", async () => {
      mockedApiClient.mockResolvedValueOnce({ success: true, user: mockUser });

      const { result, queryClient } = renderHookWithProviders(() => useLogin());

      await result.current.mutateAsync({
        email: "test@test.com",
        password: "password123",
      });

      expect(queryClient.getQueryData(authKeys.me)).toEqual(mockUser);
    });

    it("propagates errors from apiClient", async () => {
      mockedApiClient.mockRejectedValueOnce(
        new Error("Invalid email or password"),
      );

      const { result } = renderHookWithProviders(() => useLogin());

      await expect(
        result.current.mutateAsync({
          email: "test@test.com",
          password: "wrong",
        }),
      ).rejects.toThrow("Invalid email or password");
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. useRegister
  // ────────────────────────────────────────────────────────────
  describe("useRegister", () => {
    it("calls /auth/register with user data", async () => {
      mockedApiClient.mockResolvedValueOnce({ success: true, user: mockUser });

      const { result } = renderHookWithProviders(() => useRegister());

      await result.current.mutateAsync({
        fullName: "Test User",
        email: "test@test.com",
        password: "password123",
        phone: "+251900000000",
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/register", {
        method: "POST",
        body: {
          fullName: "Test User",
          email: "test@test.com",
          password: "password123",
          phone: "+251900000000",
        },
      });
    });

    it("sets the user in Zustand on success", async () => {
      mockedApiClient.mockResolvedValueOnce({ success: true, user: mockUser });

      const { result } = renderHookWithProviders(() => useRegister());

      await result.current.mutateAsync({
        fullName: "Test User",
        email: "test@test.com",
        password: "password123",
      });

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. useLogout
  // ────────────────────────────────────────────────────────────
  describe("useLogout", () => {
    it("calls /auth/logout with POST", async () => {
      mockedApiClient.mockResolvedValueOnce({});

      const { result } = renderHookWithProviders(() => useLogout());

      await result.current.mutateAsync();

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/logout", {
        method: "POST",
      });
    });

    it("clears the user in Zustand on success", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      mockedApiClient.mockResolvedValueOnce({});

      const { result } = renderHookWithProviders(() => useLogout());

      await result.current.mutateAsync();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("clears the entire QueryClient cache on success", async () => {
      mockedApiClient.mockResolvedValueOnce({});

      const { result, queryClient } = renderHookWithProviders(() =>
        useLogout(),
      );
      queryClient.setQueryData(["some-key"], { sensitive: true });

      const clearSpy = vi.spyOn(queryClient, "clear");
      await result.current.mutateAsync();

      expect(clearSpy).toHaveBeenCalled();
      expect(queryClient.getQueryData(["some-key"])).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. useForgotPassword
  // ────────────────────────────────────────────────────────────
  describe("useForgotPassword", () => {
    it("calls /auth/forgot-password with email", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "Email sent" });

      const { result } = renderHookWithProviders(() => useForgotPassword());

      await result.current.mutateAsync("test@test.com");

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/forgot-password", {
        method: "POST",
        body: { email: "test@test.com" },
      });
    });

    it("returns the API response", async () => {
      mockedApiClient.mockResolvedValueOnce({
        message: "If an account exists...",
      });

      const { result } = renderHookWithProviders(() => useForgotPassword());

      const response = await result.current.mutateAsync("test@test.com");

      expect(response).toEqual({ message: "If an account exists..." });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. useResetPassword
  // ────────────────────────────────────────────────────────────
  describe("useResetPassword", () => {
    it("calls /auth/reset-password with token and password", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "Password reset" });

      const { result } = renderHookWithProviders(() => useResetPassword());

      await result.current.mutateAsync({
        token: "abc123",
        password: "newPassword123",
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/reset-password", {
        method: "POST",
        body: { token: "abc123", password: "newPassword123" },
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. useUpdateProfile
  // ────────────────────────────────────────────────────────────
  describe("useUpdateProfile", () => {
    it("calls PATCH /auth/me with the update payload", async () => {
      mockedApiClient.mockResolvedValueOnce({
        user: { ...mockUser, fullName: "Updated Name" },
      });

      const { result } = renderHookWithProviders(() => useUpdateProfile());

      await result.current.mutateAsync({ fullName: "Updated Name" });

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/me", {
        method: "PATCH",
        body: { fullName: "Updated Name" },
      });
    });

    it("updates the user in Zustand on success", async () => {
      const updated = { ...mockUser, fullName: "Updated Name" };
      mockedApiClient.mockResolvedValueOnce({ user: updated });

      const { result } = renderHookWithProviders(() => useUpdateProfile());

      await result.current.mutateAsync({ fullName: "Updated Name" });

      expect(useAuthStore.getState().user).toEqual(updated);
    });

    it("updates the auth.me cache on success", async () => {
      const updated = { ...mockUser, fullName: "Updated Name" };
      mockedApiClient.mockResolvedValueOnce({ user: updated });

      const { result, queryClient } = renderHookWithProviders(() =>
        useUpdateProfile(),
      );

      await result.current.mutateAsync({ fullName: "Updated Name" });

      expect(queryClient.getQueryData(authKeys.me)).toEqual(updated);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. useDeleteAccount
  // ────────────────────────────────────────────────────────────
  describe("useDeleteAccount", () => {
    it("calls DELETE /auth/me", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "Account deleted" });

      const { result } = renderHookWithProviders(() => useDeleteAccount());

      await result.current.mutateAsync();

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/me", {
        method: "DELETE",
      });
    });

    it("clears the user and query cache on success", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      mockedApiClient.mockResolvedValueOnce({});

      const { result, queryClient } = renderHookWithProviders(() =>
        useDeleteAccount(),
      );
      queryClient.setQueryData(["some-key"], { data: "sensitive" });

      await result.current.mutateAsync();

      expect(useAuthStore.getState().user).toBeNull();
      expect(queryClient.getQueryData(["some-key"])).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 9. useChangePassword
  // ────────────────────────────────────────────────────────────
  describe("useChangePassword", () => {
    it("calls PATCH /auth/password with current and new password", async () => {
      mockedApiClient.mockResolvedValueOnce({ message: "Password changed" });

      const { result } = renderHookWithProviders(() => useChangePassword());

      await result.current.mutateAsync({
        currentPassword: "old123",
        newPassword: "new456789",
      });

      expect(mockedApiClient).toHaveBeenCalledWith("/auth/password", {
        method: "PATCH",
        body: { currentPassword: "old123", newPassword: "new456789" },
      });
    });

    it("propagates errors (e.g., wrong current password)", async () => {
      mockedApiClient.mockRejectedValueOnce(
        new Error("Current password is incorrect"),
      );

      const { result } = renderHookWithProviders(() => useChangePassword());

      await expect(
        result.current.mutateAsync({
          currentPassword: "wrong",
          newPassword: "new456789",
        }),
      ).rejects.toThrow("Current password is incorrect");
    });
  });
});
