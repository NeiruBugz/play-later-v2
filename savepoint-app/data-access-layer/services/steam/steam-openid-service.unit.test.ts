import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceErrorCode } from "../types";
import { SteamOpenIdService } from "./steam-openid-service";

describe("SteamOpenIdService", () => {
  let service: SteamOpenIdService;

  beforeEach(() => {
    service = new SteamOpenIdService();
  });

  describe("getAuthUrl", () => {
    it("generates correct Steam OpenID auth URL", () => {
      const returnUrl = "http://localhost:6060/auth/steam/callback";

      const authUrl = service.getAuthUrl(returnUrl);

      expect(authUrl).toContain("https://steamcommunity.com/openid/login?");
      expect(authUrl).toContain(
        "openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0"
      );
      expect(authUrl).toContain("openid.mode=checkid_setup");
      expect(authUrl).toContain(
        `openid.return_to=${encodeURIComponent(returnUrl)}`
      );
      expect(authUrl).toContain("openid.realm=http%3A%2F%2Flocalhost%3A6060");
      expect(authUrl).toContain(
        "openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select"
      );
      expect(authUrl).toContain(
        "openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select"
      );
    });

    it("extracts origin from return URL correctly", () => {
      const returnUrl =
        "https://savepoint.example.com/auth/steam/callback?foo=bar";

      const authUrl = service.getAuthUrl(returnUrl);

      expect(authUrl).toContain(
        "openid.realm=https%3A%2F%2Fsavepoint.example.com"
      );
    });

    it("throws error when return URL is invalid", () => {
      const invalidUrl = "not-a-valid-url";

      expect(() => service.getAuthUrl(invalidUrl)).toThrow();
    });
  });

  describe("validateCallback", () => {
    it("returns VALIDATION_ERROR when mode is not id_res", async () => {
      const params = new URLSearchParams({
        "openid.mode": "cancel",
      });

      const result = await service.validateCallback(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        expect(result.error).toBe("Invalid OpenID mode");
      }
    });

    it("returns UNAUTHORIZED when signature verification fails", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
        "openid.claimed_id":
          "https://steamcommunity.com/openid/id/76561198012345678",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "is_valid:false",
      });

      const result = await service.validateCallback(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.UNAUTHORIZED);
        expect(result.error).toBe("Invalid OpenID signature");
      }
    });

    it("returns VALIDATION_ERROR when claimed_id is missing", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "is_valid:true",
      });

      const result = await service.validateCallback(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        expect(result.error).toBe("Missing claimed_id");
      }
    });

    it("returns VALIDATION_ERROR when Steam ID cannot be extracted", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
        "openid.claimed_id": "https://steamcommunity.com/openid/invalid",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "is_valid:true",
      });

      const result = await service.validateCallback(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        expect(result.error).toBe("Could not extract Steam ID");
      }
    });

    it("successfully validates callback and returns Steam ID64", async () => {
      const steamId64 = "76561198012345678";
      const params = new URLSearchParams({
        "openid.mode": "id_res",
        "openid.claimed_id": `https://steamcommunity.com/openid/id/${steamId64}`,
        "openid.sig": "test_signature",
        "openid.signed": "test_signed",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "is_valid:true",
      });

      const result = await service.validateCallback(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(steamId64);
      }

      expect(global.fetch).toHaveBeenCalledWith(
        "https://steamcommunity.com/openid/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
      );

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const sentParams = new URLSearchParams(fetchCall[1]?.body as string);
      expect(sentParams.get("openid.mode")).toBe("check_authentication");
    });

    it("returns INTERNAL_ERROR when fetch throws", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
        "openid.claimed_id":
          "https://steamcommunity.com/openid/id/76561198012345678",
      });

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await service.validateCallback(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("returns UNAUTHORIZED when Steam API returns non-ok status", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
        "openid.claimed_id":
          "https://steamcommunity.com/openid/id/76561198012345678",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await service.validateCallback(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.UNAUTHORIZED);
      }
    });
  });
});
