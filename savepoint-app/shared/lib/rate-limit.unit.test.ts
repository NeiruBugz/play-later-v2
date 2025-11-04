import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit } from "./rate-limit";

function createMockRequest(ip: string): NextRequest {
  return {
    headers: {
      get: vi.fn().mockReturnValue(ip),
    },
  } as unknown as NextRequest;
}

describe("checkRateLimit", () => {
  let testCounter = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    testCounter++;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function getUniqueIP(suffix: string = ""): string {
    return `192.168.${testCounter}.${suffix || "1"}`;
  }

  describe("when user makes requests to rate-limited endpoint", () => {
    it("should allow first 20 requests within the window", () => {
      const mockRequest = createMockRequest(getUniqueIP());

      const results = [];
      for (let i = 0; i < 20; i++) {
        results.push(checkRateLimit(mockRequest));
      }

      results.forEach((result, index) => {
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(20 - (index + 1));
      });
    });

    it("should deny the 21st request within the window", () => {
      const mockRequest = createMockRequest(getUniqueIP());

      for (let i = 0; i < 20; i++) {
        checkRateLimit(mockRequest);
      }

      const result = checkRateLimit(mockRequest);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset counter after window expires", () => {
      const mockRequest = createMockRequest(getUniqueIP());

      for (let i = 0; i < 20; i++) {
        checkRateLimit(mockRequest);
      }

      const deniedResult = checkRateLimit(mockRequest);
      expect(deniedResult.allowed).toBe(false);

      vi.advanceTimersByTime(60 * 60 * 1000 + 1);

      const newResult = checkRateLimit(mockRequest);
      expect(newResult.allowed).toBe(true);
      expect(newResult.remaining).toBe(19);
    });

    it("should track different IPs independently", () => {
      const mockRequest1 = createMockRequest(getUniqueIP("1"));
      const mockRequest2 = createMockRequest(getUniqueIP("2"));

      for (let i = 0; i < 10; i++) {
        checkRateLimit(mockRequest1);
      }

      for (let i = 0; i < 5; i++) {
        checkRateLimit(mockRequest2);
      }

      const result1 = checkRateLimit(mockRequest1);
      const result2 = checkRateLimit(mockRequest2);

      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(9);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(14);
    });

    it("should respect custom limit and window parameters", () => {
      const mockRequest = createMockRequest(getUniqueIP());

      const customLimit = 5;
      const customWindow = 10 * 1000;

      for (let i = 0; i < 5; i++) {
        checkRateLimit(mockRequest, customLimit, customWindow);
      }

      const sixthRequest = checkRateLimit(
        mockRequest,
        customLimit,
        customWindow
      );

      expect(sixthRequest.allowed).toBe(false);
      expect(sixthRequest.remaining).toBe(0);
    });

    it("should extract IP from x-forwarded-for header when request.ip is unavailable", () => {
      const forwardedIP = "203.0.113.1";
      const mockRequest = createMockRequest(forwardedIP);

      const result = checkRateLimit(mockRequest);

      expect(mockRequest.headers.get).toHaveBeenCalledWith("x-forwarded-for");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(19);
    });
  });

  describe("when handling edge cases", () => {
    it("should handle requests with no IP information", () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const result = checkRateLimit(mockRequest);

      expect(result.allowed).toBe(true);
    });

    it("should maintain rate limit after partial window expiry", () => {
      const mockRequest = createMockRequest(getUniqueIP());

      for (let i = 0; i < 10; i++) {
        checkRateLimit(mockRequest);
      }

      vi.advanceTimersByTime(30 * 60 * 1000);

      const result = checkRateLimit(mockRequest);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("should handle concurrent requests from different IPs", () => {
      const ips = [getUniqueIP("1"), getUniqueIP("2"), getUniqueIP("3")];

      for (let i = 0; i < 10; i++) {
        ips.forEach((ip) => {
          const request = createMockRequest(ip);
          checkRateLimit(request);
        });
      }

      ips.forEach((ip) => {
        const request = createMockRequest(ip);
        const { remaining, allowed } = checkRateLimit(request);
        expect(allowed).toBe(true);
        expect(remaining).toBe(9);
      });
    });

    it("should handle x-forwarded-for with multiple IPs (proxy chain)", () => {
      const mockRequest = createMockRequest(
        "10.0.0.1, 172.16.0.1, 192.168.1.1"
      );

      for (let i = 0; i < 20; i++) {
        checkRateLimit(mockRequest);
      }

      const result = checkRateLimit(mockRequest);

      expect(result.allowed).toBe(false);
    });
  });
});
