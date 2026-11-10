// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError, ValidationError } from "@/shared/lib/errors";

import {
  buildSteamReturnTo,
  buildValidOpenIdParams,
  STEAM_ID_64,
} from "../../../../test/support/steam-openid-params";
import { verifyOpenIdResponse } from "./openid";

vi.mock("@env", () => ({
  env: {
    BETTER_AUTH_SECRET: "unit-test-secret",
    BETTER_AUTH_URL: "https://app.example.com",
  },
}));

const USER_ID = "user-a";

function stubSteam(body: string) {
  const fetchSpy = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => body,
  });
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

async function expectRejectedBeforeCallingSteam(
  overrides: Record<string, string>,
  userId = USER_ID
) {
  const fetchSpy = stubSteam("is_valid:true");
  await expect(
    verifyOpenIdResponse(
      { ...buildValidOpenIdParams(USER_ID), ...overrides },
      { userId }
    )
  ).rejects.toBeInstanceOf(ValidationError);
  expect(fetchSpy).not.toHaveBeenCalled();
}

beforeEach(() => {
  stubSteam("is_valid:true");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyOpenIdResponse hardening", () => {
  it("accepts a well-formed response bound to the signed-in user", async () => {
    await expect(
      verifyOpenIdResponse(buildValidOpenIdParams(USER_ID), {
        userId: USER_ID,
      })
    ).resolves.toBe(STEAM_ID_64);
  });

  describe("return_to", () => {
    it("rejects a return_to on another origin", async () => {
      const state = buildSteamReturnTo(USER_ID).split("?")[1];
      await expectRejectedBeforeCallingSteam({
        "openid.return_to": `https://evil.example.net/steam/callback?${state}`,
      });
    });

    it("rejects a return_to on another path", async () => {
      const state = buildSteamReturnTo(USER_ID).split("?")[1];
      await expectRejectedBeforeCallingSteam({
        "openid.return_to": `https://app.example.com/steam/callback-evil?${state}`,
      });
    });

    it("rejects a return_to that is not a URL", async () => {
      await expectRejectedBeforeCallingSteam({ "openid.return_to": "nope" });
    });
  });

  describe("op_endpoint", () => {
    it("rejects an endpoint other than Steam's", async () => {
      await expectRejectedBeforeCallingSteam({
        "openid.op_endpoint": "https://evil.example.net/openid/login",
      });
    });
  });

  describe("claimed_id", () => {
    it.each([
      "http://steamcommunity.com/openid/id/76561198012345678",
      "https://steamcommunity.com.evil.net/openid/id/76561198012345678",
      "https://evil.net/https://steamcommunity.com/openid/id/76561198012345678",
      "https://steamcommunity.com/openid/id/76561198012345678/extra",
    ])("rejects %s", async (claimedId) => {
      await expectRejectedBeforeCallingSteam({
        "openid.claimed_id": claimedId,
        "openid.identity": claimedId,
      });
    });

    it("rejects an identity that differs from claimed_id", async () => {
      await expectRejectedBeforeCallingSteam({
        "openid.identity": "https://steamcommunity.com/openid/id/99999",
      });
    });
  });

  describe("signed fields", () => {
    it.each([
      "claimed_id",
      "identity",
      "return_to",
      "response_nonce",
      "op_endpoint",
    ])("rejects a response that does not sign %s", async (field) => {
      const signed = buildValidOpenIdParams(USER_ID)
        ["openid.signed"]!.split(",")
        .filter((name) => name !== field)
        .join(",");
      await expectRejectedBeforeCallingSteam({ "openid.signed": signed });
    });

    it("rejects a response with no signed list", async () => {
      await expectRejectedBeforeCallingSteam({ "openid.signed": "" });
    });
  });

  describe("login-binding state", () => {
    it("rejects a return_to carrying no state", async () => {
      await expectRejectedBeforeCallingSteam({
        "openid.return_to": "https://app.example.com/steam/callback",
      });
    });

    it("rejects a state issued for a different user", async () => {
      await expectRejectedBeforeCallingSteam({}, "user-b");
    });

    it("rejects a forged state", async () => {
      await expectRejectedBeforeCallingSteam({
        "openid.return_to":
          "https://app.example.com/steam/callback?state=9999999999999.forged",
      });
    });

    it("rejects an expired state", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      const params = buildValidOpenIdParams(USER_ID);
      vi.setSystemTime(Date.now() + 11 * 60 * 1000);
      const fetchSpy = stubSteam("is_valid:true");
      await expect(
        verifyOpenIdResponse(params, { userId: USER_ID })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(fetchSpy).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe("Steam's own verdict", () => {
    it("still rejects when check_authentication is invalid", async () => {
      stubSteam("is_valid:false");
      await expect(
        verifyOpenIdResponse(buildValidOpenIdParams(USER_ID), {
          userId: USER_ID,
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("still surfaces upstream failures", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("down")));
      await expect(
        verifyOpenIdResponse(buildValidOpenIdParams(USER_ID), {
          userId: USER_ID,
        })
      ).rejects.toBeInstanceOf(UpstreamError);
    });
  });
});
