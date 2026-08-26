import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── In‑memory store (for development / test only) ───
class InMemoryStore {
  private store: Map<string, { count: number; reset: number }> = new Map();

  async get(key: string): Promise<{ count: number; reset: number } | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.reset) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  async set(key: string, count: number, reset: number): Promise<void> {
    this.store.set(key, { count, reset });
    if (this.store.size > 1000) {
      for (const [k, v] of this.store.entries()) {
        if (Date.now() > v.reset) this.store.delete(k);
      }
    }
  }

  // Minimal evalsha stub (only for dev/test)
  async evalsha(
    script: string,
    numKeys: number,
    ...args: string[]
  ): Promise<any> {
    const key = args[0];
    const windowMs = parseInt(args[1] || "60000");
    const maxRequests = parseInt(args[2] || "100");

    const now = Date.now();
    const entry = await this.get(key);
    let count = entry?.count || 0;

    if (!entry || now > entry.reset) {
      count = 1;
    } else {
      count += 1;
    }

    const reset = now + windowMs;
    await this.set(key, count, reset);

    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    return [allowed ? 1 : 0, remaining, Math.ceil(reset / 1000)];
  }
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

// ─── Rate limiter factory ───
export function createRateLimiter() {
  const isDev =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const hasUpstash =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!isDev && !hasUpstash) {
    throw new Error(
      "❌ Production environment requires Upstash Redis. " +
        "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment variables.",
    );
  }

  if (isDev && !hasUpstash) {
    console.warn(
      "⚠️ [DEV] Rate limiting using in‑memory store. Not suitable for production.",
    );
    const store = new InMemoryStore();
    return new Ratelimit({
      limiter: Ratelimit.slidingWindow(100, "60s"),
      redis: {
        get: async (key: string) => store.get(key),
        set: async (key: string, count: number, ttl: number) => {
          const reset = Date.now() + ttl * 1000;
          await store.set(key, count, reset);
        },
        evalsha: async (...args: any[]) =>
          store.evalsha(args[0], args[1], ...args.slice(2)),
        ping: async () => "PONG",
        sadd: async () => 0,
        srem: async () => 0,
        smembers: async () => [],
        getset: async () => null,
        incr: async () => 0,
        expire: async () => 0,
        ttl: async () => -1,
        del: async () => 0,
        exists: async () => 0,
        saddCount: async () => 0,
        sremCount: async () => 0,
        sismember: async () => false,
        eval: async (script: string, keys: string[], args: string[]) =>
          store.evalsha(script, keys.length, ...args),
      } as any,
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60s"),
  });
}

// ─── Main rate limit function for middleware ───
export async function rateLimit(req: NextRequest) {
  const limiter = createRateLimiter();
  const ip = getIP(req);

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  return {
    success,
    limit,
    remaining,
    reset,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
    },
  };
}
