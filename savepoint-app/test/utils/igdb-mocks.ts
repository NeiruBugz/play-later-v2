import { vi } from "vitest";

type JsonLike = Record<string, unknown> | unknown[] | null;

export type FetchResponseSpec = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: JsonLike;
};

/**
 * Mock fetch with a sequence of responses
 * Useful for testing multiple fetch calls
 */
export function mockFetchSequence(sequence: FetchResponseSpec[]) {
  const mock = vi.fn();
  sequence.forEach((spec) => {
    mock.mockResolvedValueOnce({
      ok: spec.ok ?? true,
      status: spec.status ?? (spec.ok === false ? 500 : 200),
      statusText: spec.statusText ?? "OK",
      json: async () => spec.json ?? null,
    } as Response);
  });
  Object.defineProperty(global, "fetch", { writable: true, value: mock });
  return mock;
}

/**
 * Mock successful fetch with provided data
 * @param data - The data to return from the mocked fetch
 */
export function mockFetchSuccess<T>(data: T) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => data,
  });
}

/**
 * Mock failed fetch with error status
 * @param status - HTTP status code (default: 500)
 * @param statusText - HTTP status text (default: "Internal Server Error")
 */
export function mockFetchError(status: number, statusText: string) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: async () => null,
  });
}

/**
 * Mock token fetch failure (network error)
 * Used to test token retrieval errors
 */
export function mockTokenFetchFailure() {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
}
