import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
    // Clean up expired entries
    if (this.store.size > 1000) {
      for (const [k, v] of this.store.entries()) {
        if (Date.now() > v.reset) {
          this.store.delete(k);
        }
      }
    }
  }
}

export function createRateLimiter() {
  const isDev = process.env.NODE_ENV !== "production";
  const hasUpstash =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (isDev || !hasUpstash) {
    console.warn(
      "⚠️ Rate limiting using in-memory store. Not recommended for production.",
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
        ping: async () => "PONG",
        sadd: async () => 0,
        srem: async () => 0,
        smembers: async () => [],
        eval: async () => null,
        getset: async () => null,
        incr: async () => 0,
        expire: async () => 0,
        ttl: async () => -1,
        del: async () => 0,
        exists: async () => 0,
        saddCount: async () => 0,
        sremCount: async () => 0,
        sismember: async () => false,
      } as any,
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60s"), // 100 requests per minute
  });
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

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
