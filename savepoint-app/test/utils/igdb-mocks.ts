import { vi } from "vitest";
type JsonLike = Record<string, unknown> | unknown[] | null;
export type FetchResponseSpec = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: JsonLike;
};
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
export function mockFetchSuccess<T>(data: T) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => data,
  });
}
export function mockFetchError(status: number, statusText: string) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: async () => null,
  });
}
export function mockTokenFetchFailure() {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
}
