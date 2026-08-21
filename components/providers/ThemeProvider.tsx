"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { useUIStore } from "@/lib/stores/ui-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={theme === "system" ? undefined : theme}
    >
      {children}
    </NextThemeProvider>
  );
}
