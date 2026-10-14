import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface InitializePaymentResponse {
  checkout_url: string;
  payment_id: string;
  tx_ref: string;
}

interface VerifyPaymentResponse {
  status: "success" | "failed" | "pending";
  payment_id: string;
  tx_ref: string;
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
/**
 * Starts a Chapa checkout for a rental and sends the browser to the hosted
 * payment page. Chapa redirects back through /api/v1/payments/callback.
 */
export function usePayNow() {
  const initialize = useInitializePayment();

  const payNow = async (rentalId: string) => {
    try {
      const { checkout_url } = await initialize.mutateAsync(rentalId);
      if (!checkout_url) throw new Error("Missing checkout URL");
      // Hosted checkout can't render inside the preview iframe
      if (window.self !== window.top) {
        window.open(checkout_url, "_blank", "noopener,noreferrer");
      } else {
        window.location.assign(checkout_url);
      }
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Could not start payment. Please try again.",
      );
    }
  };

  return { payNow, isPaying: initialize.isPending };
}

export function useInitializePayment() {
  return useMutation({
    mutationFn: async (rentalId: string) => {
      const response = await apiClient<InitializePaymentResponse>(
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
