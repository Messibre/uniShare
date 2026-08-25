import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      $queryRaw: vi.fn(),
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 when database is connected", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.services.database).toBe("connected");
  });

  it("should return 503 when database is disconnected", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("Connection refused"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("error");
    expect(data.services.database).toBe("disconnected");
  });
});
