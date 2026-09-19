// vitest.config.mts
import { defineConfig, defineProject } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    exclude: ["node_modules", "lib/generated/**", ".next/**"],

    projects: [
      // ─── Backend: Node.js ───
      defineProject({
        resolve: { tsconfigPaths: true },
        test: {
          name: "backend",
          environment: "node",
          globals: true,
          setupFiles: ["./tests/test/setup.ts"],
          include: [
            "tests/lib/**/*.test.ts",
            "tests/unit/**/*.test.ts",
            "tests/app/api/**/*.test.ts",
          ],
          exclude: ["tests/lib/hooks/**"],
        },
      }),

      // ─── Frontend hooks: jsdom ───
      defineProject({
        resolve: { tsconfigPaths: true },
        test: {
          name: "hooks",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./tests/test/setup.ts"],
          include: ["tests/lib/hooks/**/*.test.ts"],
        },
      }),

      // ─── Frontend components + pages: jsdom ───
      defineProject({
        resolve: { tsconfigPaths: true },
        test: {
          name: "frontend",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./tests/test/setup.ts"],
          include: [
            "tests/components/**/*.test.{ts,tsx}",
            // Only page test folders — NOT api
            "tests/app/(auth)/**/*.test.{ts,tsx}",
            "tests/app/(dashboard)/**/*.test.{ts,tsx}",
          ],
          exclude: ["tests/app/api/**"], // ← Belt-and-suspenders
        },
      }),
    ],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "lib/generated/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "tests/test/**",
        "tests/mocks/**",
        "tests/helpers/**",
      ],
    },
  },
});
