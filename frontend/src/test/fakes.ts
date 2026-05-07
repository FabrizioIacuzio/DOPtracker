import { vi } from "vitest";

/**
 * Freeze the wall-clock at `iso` so any new Date() / Date.now() in the code
 * under test is deterministic. Uses vi.setSystemTime, which leaves real
 * timers running — important because user-event's keyboard/pointer
 * simulation uses real timers internally. Tests that need fake timers
 * (e.g. for setTimeout draining) should call vi.useFakeTimers() themselves
 * AFTER any user-event interactions are complete.
 */
export function freezeTime(iso = "2026-05-07T12:00:00.000Z"): Date {
  const d = new Date(iso);
  vi.setSystemTime(d);
  return d;
}

/**
 * Make crypto.randomUUID return predictable values like "uuid-1", "uuid-2", …
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
