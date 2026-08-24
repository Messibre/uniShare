"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-on-surface-variant hover:text-primary"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={
            <button
              onClick={() => setTheme("light")}
              className="flex w-full items-center gap-2"
            >
              <Sun className="h-4 w-4" /> Light
            </button>
          }
        />
        <DropdownMenuItem
          render={
            <button
              onClick={() => setTheme("dark")}
              className="flex w-full items-center gap-2"
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
          }
        />
        <DropdownMenuItem
          render={
            <button
              onClick={() => setTheme("system")}
              className="flex w-full items-center gap-2"
            >
              <Laptop className="h-4 w-4" /> System
            </button>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
