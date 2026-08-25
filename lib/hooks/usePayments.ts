import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface InitializePaymentResponse {
  checkout_url: string;
  payment_id: string;
  tx_ref: string;
}

interface VerifyPaymentResponse {
  status: "success" | "failed" | "pending";
  payment_id: string;
}

export const paymentKeys = {
  all: ["payments"] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (txRef: string) => [...paymentKeys.details(), txRef] as const,
};

export function useVerifyPayment(txRef: string) {
  return useQuery({
    queryKey: paymentKeys.detail(txRef),
    queryFn: async () => {
      const response = await apiClient<VerifyPaymentResponse>(
        `/payments/verify?tx_ref=${txRef}`,
      );
      return response;
    },
    enabled: !!txRef,
    retry: 3,
    staleTime: 30 * 1000,
  });
}
export function useInitializePayment() {
  return useMutation({
    mutationFn: async (rentalId: string) => {
      const response = await apiClient<{ checkout_url: string }>(
        "/payments/initialize",
        {
          method: "POST",
          body: { rentalId },
        },
      );
      return response;
    },
  });
}
