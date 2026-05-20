/**
 * Integration tests for shared/api/steam/openid.ts.
 *
 * Verifies the Steam OpenID `check_authentication` round-trip.
 * `fetch` is stubbed via `vi.stubGlobal`.
 *
 * Contract:
 *   verifyOpenIdResponse(params: Record<string, string>): Promise<string>
 *     - throws ValidationError when openid.mode !== "id_res"
 *     - throws ValidationError when claimed_id is missing
 *     - throws ValidationError when steamid64 cannot be extracted from claimed_id
 *     - throws ValidationError when Steam responds with "is_valid:false"
 *     - throws UpstreamError when the verification HTTP call fails (network or non-2xx)
 *     - returns the steam64 id on success (idempotent — pure of internal state)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyOpenIdResponse } from "@/shared/api/steam";
import { UpstreamError, ValidationError } from "@/shared/lib/errors";

const STEAM_ID_64 = "76561198012345678";

const VALID_PARAMS: Record<string, string> = {
  "openid.mode": "id_res",
  "openid.ns": "http://specs.openid.net/auth/2.0",
  "openid.claimed_id": `https://steamcommunity.com/openid/id/${STEAM_ID_64}`,
  "openid.identity": `https://steamcommunity.com/openid/id/${STEAM_ID_64}`,
  "openid.return_to": "http://localhost:6061/api/steam/callback",
  "openid.sig": "test-signature",
  "openid.signed":
    "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
  "openid.assoc_handle": "12345",
  "openid.response_nonce": "2026-05-20T00:00:00Zabcdef",
  "openid.op_endpoint": "https://steamcommunity.com/openid/login",
};

function makeFetchResponse(init: {
  ok: boolean;
  status?: number;
  body: string;
}): Response {
  return {
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    statusText: init.ok ? "OK" : "Error",
    headers: new Headers(),
    text: async () => init.body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("verifyOpenIdResponse", () => {
  describe("given Steam confirms is_valid:true", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: true,
            body: "ns:http://...\nis_valid:true\n",
          })
        )
      );
    });

    it("returns the verified Steam ID64", async () => {
      const result = await verifyOpenIdResponse(VALID_PARAMS);
      expect(result).toBe(STEAM_ID_64);
    });

    it("posts check_authentication to the Steam OpenID endpoint", async () => {
      const spy = vi
        .fn()
        .mockResolvedValue(
          makeFetchResponse({ ok: true, body: "is_valid:true" })
        );
      vi.stubGlobal("fetch", spy);

      await verifyOpenIdResponse(VALID_PARAMS);
      const [url, init] = spy.mock.calls[0] ?? [];
      expect(String(url)).toBe("https://steamcommunity.com/openid/login");
      expect(init?.method).toBe("POST");
      const body = new URLSearchParams(init?.body as string);
      expect(body.get("openid.mode")).toBe("check_authentication");
      expect(body.get("openid.claimed_id")).toBe(
        `https://steamcommunity.com/openid/id/${STEAM_ID_64}`
      );
    });

    it("is idempotent — re-verifying the same params yields the same Steam ID", async () => {
      const a = await verifyOpenIdResponse(VALID_PARAMS);
      const b = await verifyOpenIdResponse(VALID_PARAMS);
      expect(a).toBe(b);
      expect(a).toBe(STEAM_ID_64);
    });
  });

  describe("given Steam confirms is_valid:false", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: true,
            body: "ns:http://...\nis_valid:false\n",
          })
        )
      );
    });

    it("throws ValidationError (forged or expired signature)", async () => {
      await expect(verifyOpenIdResponse(VALID_PARAMS)).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });

  describe("given openid.mode is not id_res", () => {
    it("throws ValidationError without calling Steam", async () => {
      const spy = vi.fn();
      vi.stubGlobal("fetch", spy);

      await expect(
        verifyOpenIdResponse({ ...VALID_PARAMS, "openid.mode": "cancel" })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("given openid.claimed_id is missing", () => {
    it("throws ValidationError", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            makeFetchResponse({ ok: true, body: "is_valid:true" })
          )
      );
      const rest = { ...VALID_PARAMS };
      delete rest["openid.claimed_id"];
      await expect(verifyOpenIdResponse(rest)).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });

  describe("given openid.claimed_id does not contain a steam64 id", () => {
    it("throws ValidationError", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            makeFetchResponse({ ok: true, body: "is_valid:true" })
          )
      );
      await expect(
        verifyOpenIdResponse({
          ...VALID_PARAMS,
          "openid.claimed_id":
            "https://steamcommunity.com/openid/notanid/banana",
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("given the verification HTTP call fails", () => {
    it("throws UpstreamError on network failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("fetch failed"))
      );
      await expect(verifyOpenIdResponse(VALID_PARAMS)).rejects.toBeInstanceOf(
        UpstreamError
      );
    });

    it("throws UpstreamError on non-2xx response", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            makeFetchResponse({ ok: false, status: 500, body: "boom" })
          )
      );
      await expect(verifyOpenIdResponse(VALID_PARAMS)).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });
});
