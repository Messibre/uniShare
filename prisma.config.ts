import "dotenv/config";
import { defineConfig, env as prismaEnv } from "prisma/config";

import { env } from "./lib/env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env.DATABASE_URL,
  },
});
