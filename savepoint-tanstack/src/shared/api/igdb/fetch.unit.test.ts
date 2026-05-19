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

vi.mock("@env", () => ({
  env: { IGDB_CLIENT_ID: "test-client-id" },
}));

vi.mock("./token", () => ({
  getAccessToken: vi.fn().mockResolvedValue("mock-token"),
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

describe("igdbFetch", () => {
  beforeEach(() => {
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
});
