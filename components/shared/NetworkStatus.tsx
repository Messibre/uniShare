"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

export function NetworkStatus() {
  const queryClient = useQueryClient();
  const [isOffline, setIsOffline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const goOffline = () => {
      wasOffline.current = true;
      setIsOffline(true);
    };

    const goOnline = () => {
      setIsOffline(false);
      if (wasOffline.current) {
        wasOffline.current = false;
        toast.success("Back online");
        queryClient.invalidateQueries();
      }
    };

    if (!navigator.onLine) goOffline();

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [queryClient]);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-on-surface px-4 py-2 text-center text-body-sm font-medium text-surface"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      You are offline. Changes can&apos;t be saved until you reconnect.
    </div>
  );
}
