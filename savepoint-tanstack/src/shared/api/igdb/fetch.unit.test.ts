/**
 * Tests pin the IGDB error-tracing contract:
 *   - non-2xx with an IGDB-shaped body lifts `igdbTitle` / `igdbStatus` /
 *     `igdbCause` onto the thrown `IgdbHttpError`;
 *   - non-2xx with a non-IGDB body still captures a `bodySnippet`;
 *   - every thrown error carries the query body we sent + a `requestId`.
 *
 * `fetch` is stubbed via `vi.stubGlobal` per the fetch.ts comment.
 * `getAccessToken` is mocked so we don't exercise Twitch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IgdbHttpError } from "./errors";
import { igdbFetch } from "./fetch";
import { igdbResponseCache } from "./response-cache";
import { forceRefresh } from "./token";

vi.mock("@env", () => ({
  env: { IGDB_CLIENT_ID: "test-client-id" },
}));

vi.mock("./token", () => ({
  getAccessToken: vi.fn().mockResolvedValue("mock-token"),
  forceRefresh: vi.fn(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  const makeStub = (): Record<string, unknown> => {
    const stub: Record<string, unknown> = {
      fatal: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
    };
    stub.child = vi.fn(() => stub);
    return stub;
  };
  return { ...actual, createLogger: vi.fn(() => makeStub()) };
});

function makeFetchResponse(init: {
  ok: boolean;
  status: number;
  statusText?: string;
  body?: string;
  json?: unknown;
  headers?: Record<string, string>;
}): Response {
  const headers = new Headers(init.headers ?? {});
  return {
    ok: init.ok,
    status: init.status,
    statusText: init.statusText ?? "",
    headers,
    text: async () => init.body ?? "",
    json: async () => init.json,
  } as unknown as Response;
}

const QUERY = `fields name,slug; where id = 1; limit 1;`;

const OK_RESPONSE = makeFetchResponse({
  ok: true,
  status: 200,
  json: [{ id: 1, name: "Halo", slug: "halo" }],
});

function makeStatusResponse(status: number): Response {
  return makeFetchResponse({ ok: false, status, body: "" });
}

describe("igdbFetch", () => {
  beforeEach(() => {
    igdbResponseCache.clear();
    vi.mocked(forceRefresh).mockClear();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-0000-0000-000000000001" as `${string}-${string}-${string}-${string}-${string}`
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("given the IGDB response is 2xx", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: true,
            status: 200,
            json: [{ id: 1, name: "Halo", slug: "halo" }],
          })
        )
      );
    });

    it("returns the parsed JSON body", async () => {
      const result = await igdbFetch("/games", QUERY);
      expect(result).toEqual([{ id: 1, name: "Halo", slug: "halo" }]);
    });
  });

  describe("given the IGDB response is a 400 with an IGDB error envelope", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: false,
            status: 400,
            statusText: "Bad Request",
            body: JSON.stringify([
              {
                title: "Syntax Error",
                status: 400,
                cause: "Expected `,` at position 47",
              },
            ]),
            headers: { "cf-ray": "ray-abc" },
          })
        )
      );
    });

    it("throws an IgdbHttpError carrying the lifted IGDB fields, query, and requestId", async () => {
      await expect(igdbFetch("/games", QUERY)).rejects.toMatchObject({
        name: "IgdbHttpError",
        context: {
          status: 400,
          igdbTitle: "Syntax Error",
          igdbStatus: 400,
          igdbCause: "Expected `,` at position 47",
          query: QUERY,
          resource: "/games",
          requestId: "00000000-0000-0000-0000-000000000001",
          cfRay: "ray-abc",
        },
      });
    });
  });

  describe("given the IGDB response is a 400 with an IGDB envelope but empty cause", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: false,
            status: 400,
            body: JSON.stringify([{ title: "Invalid Field", status: 400 }]),
          })
        )
      );
    });

    it("still surfaces title + status + the query we sent", async () => {
      try {
        await igdbFetch("/games", QUERY);
        expect.fail("should have thrown");
      } catch (thrown) {
        expect(thrown).toBeInstanceOf(IgdbHttpError);
        const err = thrown as IgdbHttpError;
        expect(err.context.igdbTitle).toBe("Invalid Field");
        expect(err.context.igdbCause).toBeUndefined();
        expect(err.context.query).toBe(QUERY);
      }
    });
  });

  describe("given the IGDB response is a non-2xx with a non-JSON body", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: false,
            status: 502,
            statusText: "Bad Gateway",
            body: "<html>upstream offline</html>",
          })
        )
      );
    });

    it("captures the raw body as bodySnippet without IGDB envelope fields", async () => {
      try {
        await igdbFetch("/games", QUERY);
        expect.fail("should have thrown");
      } catch (thrown) {
        const err = thrown as IgdbHttpError;
        expect(err).toBeInstanceOf(IgdbHttpError);
        expect(err.context.status).toBe(502);
        expect(err.context.bodySnippet).toBe("<html>upstream offline</html>");
        expect(err.context.igdbTitle).toBeUndefined();
      }
    });
  });

  describe("given IGDB rejects the token with a 401 once", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi
        .fn()
        .mockResolvedValueOnce(makeStatusResponse(401))
        .mockResolvedValueOnce(OK_RESPONSE);
      vi.stubGlobal("fetch", fetchMock);
    });

    it("refreshes the token and returns the retried response", async () => {
      await expect(igdbFetch("/games", QUERY)).resolves.toEqual([
        { id: 1, name: "Halo", slug: "halo" },
      ]);
      expect(forceRefresh).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("given IGDB keeps returning 401", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn().mockResolvedValue(makeStatusResponse(401));
      vi.stubGlobal("fetch", fetchMock);
    });

    it("retries once, then throws the 401", async () => {
      await expect(igdbFetch("/games", QUERY)).rejects.toMatchObject({
        name: "IgdbHttpError",
        context: { status: 401 },
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("given IGDB rate-limits the request with a 429 once", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi
        .fn()
        .mockResolvedValueOnce(makeStatusResponse(429))
        .mockResolvedValueOnce(OK_RESPONSE);
      vi.stubGlobal("fetch", fetchMock);
    });

    it("waits and returns the retried response", async () => {
      await expect(igdbFetch("/games", QUERY)).resolves.toEqual([
        { id: 1, name: "Halo", slug: "halo" },
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("given IGDB keeps returning 429", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn().mockResolvedValue(makeStatusResponse(429));
      vi.stubGlobal("fetch", fetchMock);
    });

    it("retries once, then throws the 429", async () => {
      await expect(igdbFetch("/games", QUERY)).rejects.toMatchObject({
        context: { status: 429 },
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("given any request", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      fetchMock = vi.fn().mockResolvedValue(OK_RESPONSE);
      vi.stubGlobal("fetch", fetchMock);
      await igdbFetch("/games", QUERY);
    });

    it("sends an abort signal so a hung socket cannot hold the request", () => {
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("given the same query was answered moments ago", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      fetchMock = vi.fn().mockResolvedValue(OK_RESPONSE);
      vi.stubGlobal("fetch", fetchMock);
      await igdbFetch("/games", QUERY);
      await igdbFetch("/games", QUERY);
    });

    it("answers from the cache without calling IGDB again", () => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });
  });

  describe("given the same query failed moments ago", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      fetchMock = vi
        .fn()
        .mockResolvedValueOnce(makeStatusResponse(500))
        .mockResolvedValueOnce(OK_RESPONSE);
      vi.stubGlobal("fetch", fetchMock);
      await igdbFetch("/games", QUERY).catch(() => undefined);
    });

    it("calls IGDB again instead of replaying the failure", async () => {
      await expect(igdbFetch("/games", QUERY)).resolves.toEqual([
        { id: 1, name: "Halo", slug: "halo" },
      ]);
    });
  });
});
