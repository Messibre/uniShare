export interface EnvConfig {
  DATABASE_URL: string;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;

  APP_BASE_URL: string;
  NODE_ENV: "development" | "production" | "test";

  CHAPA_SECRET_KEY: string;

  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;

  FAYDA_CLIENT_ID?: string;
  FAYDA_CLIENT_SECRET?: string;
  FAYDA_REDIRECT_URI?: string;
}

const REQUIRED_ENV_VARS: (keyof EnvConfig)[] = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "APP_BASE_URL",
  "CHAPA_SECRET_KEY",
];

const OPTIONAL_ENV_VARS: (keyof EnvConfig)[] = [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "FAYDA_CLIENT_ID",
  "FAYDA_CLIENT_SECRET",
  "FAYDA_REDIRECT_URI",
];

const DEFAULTS: Partial<EnvConfig> = {
  NODE_ENV: "development",
  EMAIL_FROM: "noreply@unishare.com",
};

function validateEnv(): EnvConfig {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing
        .map((key) => `  - ${key}`)
        .join("\n")}\n\n` + `Please add them to your .env.local file.`,
    );
  }

  const config: EnvConfig = {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    APP_BASE_URL: process.env.APP_BASE_URL!,
    CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY!,
    NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM || DEFAULTS.EMAIL_FROM,
    FAYDA_CLIENT_ID: process.env.FAYDA_CLIENT_ID,
    FAYDA_CLIENT_SECRET: process.env.FAYDA_CLIENT_SECRET,
    FAYDA_REDIRECT_URI: process.env.FAYDA_REDIRECT_URI,
  };

  return config;
}

export const env = validateEnv();

export function hasEnvVar(key: keyof EnvConfig): boolean {
  return !!env[key];
}

export function getEnvStatus(): Record<string, "✅" | "❌" | "🔒"> {
  const status: Record<string, "✅" | "❌" | "🔒"> = {};
  const sensitive = [
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CHAPA_SECRET_KEY",
    "RESEND_API_KEY",
  ];

  for (const key of [...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS]) {
    if (sensitive.includes(key)) {
      status[key] = env[key] ? "🔒" : "❌";
    } else {
      status[key] = env[key] ? "✅" : "❌";
    }
  }

  return status;
}

export function printEnvStatus(): void {
  const status = getEnvStatus();
  console.log("📋 Environment Variables Status:");
  console.log("─".repeat(40));
  for (const [key, value] of Object.entries(status)) {
    const label = value === "🔒" ? "🔒 (set)" : value;
    console.log(`  ${key}: ${label}`);
  }
  console.log("─".repeat(40));
}
