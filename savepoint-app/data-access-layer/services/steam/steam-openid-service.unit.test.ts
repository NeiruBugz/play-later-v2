import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/shared/lib/errors";

import { SteamOpenIdService } from "./steam-openid-service";

vi.mock("@/shared/lib", () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  };

  return {
    createLogger: vi.fn(() => mockLogger),
    logger: mockLogger,
    LOGGER_CONTEXT: {
      SERVICE: "service",
    },
  };
});

describe("SteamOpenIdService", () => {
  let service: SteamOpenIdService;

  beforeEach(() => {
    service = new SteamOpenIdService();
  });

  afterEach(() => {
    vi.resetAllMocks();
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
    it("throws UnauthorizedError when mode is not id_res", async () => {
      const params = new URLSearchParams({
        "openid.mode": "cancel",
      });

      await expect(service.validateCallback(params)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("throws UnauthorizedError with 'Invalid OpenID mode' when mode is not id_res", async () => {
      const params = new URLSearchParams({
        "openid.mode": "cancel",
      });

      await expect(service.validateCallback(params)).rejects.toThrow(
        "Invalid OpenID mode"
      );
    });

    it("throws UnauthorizedError when signature verification fails", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
        "openid.claimed_id":
          "https://steamcommunity.com/openid/id/76561198012345678",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "is_valid:false",
      });

      await expect(service.validateCallback(params)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("throws UnauthorizedError when claimed_id is missing", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "is_valid:true",
      });

      await expect(service.validateCallback(params)).rejects.toThrow(
        "Missing claimed_id"
      );
    });

    it("throws UnauthorizedError when Steam ID cannot be extracted from claimed_id", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
        "openid.claimed_id": "https://steamcommunity.com/openid/invalid",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "is_valid:true",
      });

      await expect(service.validateCallback(params)).rejects.toThrow(
        "Could not extract Steam ID"
      );
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

      expect(result).toBe(steamId64);

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

    it("propagates error when fetch throws", async () => {
      const params = new URLSearchParams({
        "openid.mode": "id_res",
        "openid.claimed_id":
          "https://steamcommunity.com/openid/id/76561198012345678",
      });

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(service.validateCallback(params)).rejects.toThrow(
        "Network error"
      );
    });

    it("returns false from verifySignature when Steam API returns non-ok status, then throws UnauthorizedError", async () => {
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

      await expect(service.validateCallback(params)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });
});
