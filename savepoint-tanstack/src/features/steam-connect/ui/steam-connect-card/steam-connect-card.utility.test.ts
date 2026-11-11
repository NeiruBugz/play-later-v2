import { describe, expect, it } from "vitest";

import { buildSteamOpenIdLoginUrl } from "./steam-connect-card.utility";

const STATE = "1700000000000.signature";

describe("buildSteamOpenIdLoginUrl", () => {
  describe("given a localhost origin", () => {
    const origin = "http://localhost:3000";
    const url = buildSteamOpenIdLoginUrl(origin, STATE);
    const parsed = new URL(url);
    const params = parsed.searchParams;

    it("points to the Steam OpenID login endpoint", () => {
      expect(parsed.origin).toBe("https://steamcommunity.com");
      expect(parsed.pathname).toBe("/openid/login");
    });

    it("sets openid.ns to the OpenID 2.0 namespace", () => {
      expect(params.get("openid.ns")).toBe("http://specs.openid.net/auth/2.0");
    });

    it("sets openid.mode to checkid_setup", () => {
      expect(params.get("openid.mode")).toBe("checkid_setup");
    });

    it("sets openid.return_to to origin + /steam/callback carrying the state", () => {
      expect(params.get("openid.return_to")).toBe(
        `${origin}/steam/callback?state=${STATE}`
      );
    });

    it("sets openid.realm to the bare origin", () => {
      expect(params.get("openid.realm")).toBe(origin);
    });

    it("sets openid.identity to the identifier_select value", () => {
      expect(params.get("openid.identity")).toBe(
        "http://specs.openid.net/auth/2.0/identifier_select"
      );
    });

    it("sets openid.claimed_id to the identifier_select value", () => {
      expect(params.get("openid.claimed_id")).toBe(
        "http://specs.openid.net/auth/2.0/identifier_select"
      );
    });
  });

  describe("given a production HTTPS origin", () => {
    const origin = "https://app.example.com";
    const url = buildSteamOpenIdLoginUrl(origin, STATE);
    const parsed = new URL(url);
    const params = parsed.searchParams;

    it("uses the production origin in return_to", () => {
      expect(params.get("openid.return_to")).toBe(
        `https://app.example.com/steam/callback?state=${STATE}`
      );
    });

    it("uses the production origin as realm", () => {
      expect(params.get("openid.realm")).toBe("https://app.example.com");
    });
  });

  describe("given a site URL with a trailing slash", () => {
    const url = buildSteamOpenIdLoginUrl("https://app.example.com/", STATE);
    const params = new URL(url).searchParams;

    it("keeps a single slash before /steam/callback in return_to", () => {
      expect(params.get("openid.return_to")).toBe(
        `https://app.example.com/steam/callback?state=${STATE}`
      );
    });

    it("uses the bare origin as realm", () => {
      expect(params.get("openid.realm")).toBe("https://app.example.com");
    });
  });
});
