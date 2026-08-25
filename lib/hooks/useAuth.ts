import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: "STUDENT" | "ADMIN";
  isIdVerified: boolean;
  createdAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  success: boolean;
}

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useUser() {
  const { setUser, setLoading } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        const response = await apiClient<AuthResponse>("/auth/me");
        setUser(response.user);
        return response.user;
      } catch (error) {
        setUser(null);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient<AuthResponse>("/auth/login", {
        method: "POST",
        body: credentials,
      });
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient<AuthResponse>("/auth/register", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await apiClient("/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(authKeys.me, null);
      queryClient.clear(); // Clear all cached queries
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient<{ message: string }>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: { email },
        },
      );
      return response;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      const response = await apiClient<{ message: string }>(
        "/auth/reset-password",
        {
          method: "POST",
          body: { token, password },
        },
      );
      return response;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (
      data: Partial<Omit<User, "id" | "role" | "isIdVerified" | "createdAt">>,
    ) => {
      const response = await apiClient<{ user: User }>("/auth/me", {
        method: "PATCH",
        body: data,
      });
      return response.user;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await apiClient("/auth/me", { method: "DELETE" });
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(authKeys.me, null);
      queryClient.clear();
    },
  });
}
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await apiClient<{ message: string }>("/auth/password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      });
      return response;
    },
  });
}
