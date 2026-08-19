import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/test/setup.ts"],
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "lib/generated/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["lib/generated/**", "**/*.test.ts", "tests/test/**"],
    },
  },
});
