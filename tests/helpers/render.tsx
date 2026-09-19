import React from "react";
import { render, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";

// Create a fresh QueryClient for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Reset Zustand store between tests
export function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

// Wrapper component for render/renderHook
function createWrapper(queryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

//  For components
export function renderWithProviders(
  ui: React.ReactElement,
  queryClient = createTestQueryClient(),
) {
  return {
    queryClient,
    ...render(ui, { wrapper: createWrapper(queryClient) }),
  };
}

//  For hooks
export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options?: { queryClient?: QueryClient; initialProps?: Props },
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  return {
    queryClient,
    ...renderHook(hook, {
      wrapper: createWrapper(queryClient),
      initialProps: options?.initialProps,
    }),
  };
}
