import { vi } from "vitest";

/**
 * Freeze the system clock at `iso`. Uses fake timers so any setTimeout the
 * code under test schedules can be advanced deterministically. Tests that
 * don't need fake timers should still use this and call vi.useRealTimers()
 * in afterEach (the global setup already does this).
 */
export function freezeTime(iso = "2026-05-07T12:00:00.000Z"): Date {
  const d = new Date(iso);
  vi.useFakeTimers({ now: d, shouldAdvanceTime: false });
  return d;
}

/**
 * Make crypto.randomUUID return predictable values like "uuid-1", "uuid-2", …
 * Returns the spy so tests can assert call counts.
 */
export function seedRandomUuid(prefix = "uuid"): { mock: ReturnType<typeof vi.spyOn> } {
  let counter = 0;
  const mock = vi
    .spyOn(globalThis.crypto, "randomUUID")
    .mockImplementation(() => `${prefix}-${++counter}` as `${string}-${string}-${string}-${string}-${string}`);
  return { mock };
}

/**
 * Make Math.random return values from `values` in order, recycling at the end.
 * Math.random.toString(36).substring(2, 6) is used by BatchForm to build the
 * 4-char suffix; supplying values like 0.123456 yields a deterministic suffix.
 */
export function seedMathRandom(values: number[]): void {
  if (values.length === 0) {
    throw new Error("seedMathRandom requires at least one value");
  }
  let i = 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    const v = values[i % values.length];
    i++;
    return v;
  });
}
