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

export function mockFetchSuccess(json: JsonLike) {
  return mockFetchSequence([{ ok: true, json }]);
}

export function mockFetchError(
  statusText = "Internal Server Error",
  status = 500
) {
  return mockFetchSequence([{ ok: false, statusText, status }]);
}

export function mockTokenFetchFailure(
  statusText = "Unauthorized",
  status = 401
) {
  // First call fails for token; subsequent calls will not be used
  return mockFetchSequence([{ ok: false, statusText, status }]);
}
