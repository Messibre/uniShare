import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "@/lib/bcrypt";

describe("hashPassword()", () => {
  it("produces a bcrypt hash different from the plaintext", async () => {
    const hash = await hashPassword("mypassword1");
    expect(hash).not.toBe("mypassword1");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword("samepassword1"),
      hashPassword("samepassword1"),
    ]);
    expect(hashA).not.toBe(hashB);
  });

  it("can hash an empty string without throwing", async () => {
    const hash = await hashPassword("");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe("comparePassword()", () => {
  it("returns true for a matching password/hash pair", async () => {
    const hash = await hashPassword("correct-horse-1");
    await expect(comparePassword("correct-horse-1", hash)).resolves.toBe(true);
  });

  it("returns false for a non-matching password", async () => {
    const hash = await hashPassword("correct-horse-1");
    await expect(comparePassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("returns false when compared against a malformed hash", async () => {
    await expect(comparePassword("anything1", "not-a-real-hash")).resolves.toBe(
      false,
    );
  });

  it("is case-sensitive", async () => {
    const hash = await hashPassword("CaseSensitive1");
    await expect(comparePassword("casesensitive1", hash)).resolves.toBe(false);
  });
});
