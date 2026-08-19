import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("joins simple string classes", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignores falsy values (undefined, null, false, '')", () => {
    expect(cn("a", undefined, null, false, "", "b")).toBe("a b");
  });

  it("flattens arrays of classes", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("resolves conflicting tailwind utility classes, keeping the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps non-conflicting classes when merging", () => {
    expect(cn("text-sm", "font-bold", "text-lg")).toBe("font-bold text-lg");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });

  it("returns an empty string when given nothing", () => {
    expect(cn()).toBe("");
  });

  it("returns an empty string when everything is falsy", () => {
    expect(cn(undefined, null, false)).toBe("");
  });

  it("de-duplicates identical classes via tailwind-merge", () => {
    expect(cn("block", "block")).toBe("block");
  });
});
