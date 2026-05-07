import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

interface MockMql {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
}

describe("useIsMobile", () => {
  let mql: MockMql;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    mql = {
      matches: false,
      media: "",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    vi.spyOn(window, "matchMedia").mockImplementation((q) => {
      mql.media = q;
      return mql as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  function setInnerWidth(px: number): void {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: px,
    });
  }

  it("returns false when innerWidth >= 768", () => {
    setInnerWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when innerWidth < 768", () => {
    setInnerWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns true exactly at the breakpoint - 1 (767) and false at the breakpoint (768)", () => {
    setInnerWidth(767);
    const a = renderHook(() => useIsMobile()).result.current;
    setInnerWidth(768);
    const b = renderHook(() => useIsMobile()).result.current;
    expect(a).toBe(true);
    expect(b).toBe(false);
  });

  it("subscribes to the media-query change event with the documented query string", () => {
    setInnerWidth(1024);
    renderHook(() => useIsMobile());
    expect(mql.media).toBe("(max-width: 767px)");
    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("unsubscribes from the media-query change event on unmount", () => {
    setInnerWidth(1024);
    const { unmount } = renderHook(() => useIsMobile());
    expect(mql.addEventListener).toHaveBeenCalledTimes(1);
    const handler = mql.addEventListener.mock.calls[0][1];
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith("change", handler);
  });

  it("re-evaluates innerWidth when the media-query change event fires", () => {
    setInnerWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    const handler = mql.addEventListener.mock.calls[0][1] as () => void;
    act(() => {
      setInnerWidth(500);
      handler();
    });
    expect(result.current).toBe(true);
  });
});
