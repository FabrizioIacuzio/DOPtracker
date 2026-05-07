import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("returns an empty string when called with no inputs", () => {
    expect(cn()).toBe("");
  });

  it("joins multiple class strings with spaces", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, null, undefined, "", "bar")).toBe("foo bar");
  });

  it("flattens arrays of class values", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("evaluates the conditional-object form (clsx semantics)", () => {
    expect(cn({ foo: true, bar: false, baz: 1 })).toBe("foo baz");
  });

  it("dedupes Tailwind utilities, keeping the last occurrence", () => {
    // tailwind-merge: later utilities in the same group win.
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("preserves utilities from different groups", () => {
    expect(cn("p-2 text-red-500")).toBe("p-2 text-red-500");
  });

  it("merges conditional and explicit classes", () => {
    expect(cn("base", { active: true, disabled: false }, "extra")).toBe("base active extra");
  });
});
