import {
  cleanupDatabase,
  getTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories/user";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { HTTP_STATUS } from "@/shared/config/http-codes";

import type { RequestContext } from "../types";
import { connectSteamHandler } from "./steam-connect.handler";

const STEAM_API_BASE = "https://api.steampowered.com";

const steamHandlers = [
  http.get(
    `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`,
    ({ request }) => {
      const url = new URL(request.url);
      const steamIds = url.searchParams.get("steamids");

      if (!steamIds) {
        return new HttpResponse(null, { status: 400 });
      }

      if (steamIds === "76561198012345678") {
        return HttpResponse.json({
          response: {
            players: [
              {
                steamid: "76561198012345678",
                personaname: "TestPlayer",
                profileurl: "https://steamcommunity.com/id/testplayer/",
                avatarfull: "https://example.com/avatar.jpg",
                communityvisibilitystate: 3,
              },
            ],
          },
        });
      }

      if (steamIds === "76561198087654321") {
        return HttpResponse.json({
          response: {
            players: [
              {
                steamid: "76561198087654321",
                personaname: "UpdatedPlayer",
                profileurl: "https://steamcommunity.com/id/updatedplayer/",
                avatarfull: "https://example.com/updated-avatar.jpg",
                communityvisibilitystate: 3,
              },
            ],
          },
        });
      }

      if (steamIds === "76561198099999999") {
        return HttpResponse.json({
          response: {
            players: [
              {
                steamid: "76561198099999999",
                personaname: "PrivatePlayer",
                profileurl: "https://steamcommunity.com/id/privateplayer/",
                avatarfull: "https://example.com/private-avatar.jpg",
                communityvisibilitystate: 1,
              },
            ],
          },
        });
      }

      if (steamIds === "99999999999999999") {
        return HttpResponse.json({
          response: {
            players: [],
          },
        });
      }

      return new HttpResponse(null, { status: 500 });
    }
  ),

  http.get(
    `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`,
    ({ request }) => {
      const url = new URL(request.url);
      const vanityUrl = url.searchParams.get("vanityurl");

      if (vanityUrl === "testplayer") {
        return HttpResponse.json({
          response: {
            success: 1,
            steamid: "76561198012345678",
          },
        });
      }

      if (vanityUrl === "nonexistentuser") {
        return HttpResponse.json({
          response: {
            success: 42,
            message: "No match",
          },
        });
      }

      return new HttpResponse(null, { status: 500 });
    }
  ),
];

const server = setupServer(...steamHandlers);

beforeAll(async () => {
  await setupDatabase();
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(async () => {
  server.close();
  await cleanupDatabase();
});

afterEach(() => {
  server.resetHandlers();
});

function createMockContext(ip: string = "127.0.0.1"): RequestContext {
  return {
    ip,
    headers: new Headers({ "x-forwarded-for": ip }),
    url: new URL("http://localhost/api/steam/connect"),
  };
}

describe("connectSteamHandler (integration)", () => {
  let testCounter = 0;

  function getUniqueIP(): string {
    testCounter++;
    return `192.168.${Math.floor(testCounter / 256)}.${testCounter % 256}`;
  }

  describe("Success Cases", () => {
    it("should connect Steam account with valid Steam ID64 and update User record", async () => {
      const user = await createUser();
      const steamId64 = "76561198012345678";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: steamId64, userId: user.id },
        context
      );

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.status).toBe(HTTP_STATUS.OK);
        expect(result.data.profile).toEqual({
          steamId64: "76561198012345678",
          displayName: "TestPlayer",
          avatarUrl: "https://example.com/avatar.jpg",
          profileUrl: "https://steamcommunity.com/id/testplayer/",
          isPublic: true,
        });

        const updatedUser = await getTestDatabase().user.findUnique({
          where: { id: user.id },
        });

        expect(updatedUser?.steamId64).toBe("76561198012345678");
        expect(updatedUser?.steamUsername).toBe("TestPlayer");
        expect(updatedUser?.steamAvatar).toBe("https://example.com/avatar.jpg");
        expect(updatedUser?.steamProfileURL).toBe(
          "https://steamcommunity.com/id/testplayer/"
        );
        expect(updatedUser?.steamConnectedAt).not.toBeNull();
        expect(updatedUser?.steamConnectedAt).toBeInstanceOf(Date);
      }
    });

    it("should connect Steam account with valid vanity URL and resolve it", async () => {
      const user = await createUser();
      const vanityUrl = "testplayer";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: vanityUrl, userId: user.id },
        context
      );

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.status).toBe(HTTP_STATUS.OK);
        expect(result.data.profile.steamId64).toBe("76561198012345678");
        expect(result.data.profile.displayName).toBe("TestPlayer");

        const updatedUser = await getTestDatabase().user.findUnique({
          where: { id: user.id },
        });

        expect(updatedUser?.steamId64).toBe("76561198012345678");
        expect(updatedUser?.steamUsername).toBe("TestPlayer");
      }
    });

    it("should update User record when reconnecting with different Steam ID", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "OldPlayer",
        steamAvatar: "https://example.com/old-avatar.jpg",
        steamProfileURL: "https://steamcommunity.com/id/oldplayer/",
      });

      const newSteamId64 = "76561198087654321";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: newSteamId64, userId: user.id },
        context
      );

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.profile.steamId64).toBe("76561198087654321");
        expect(result.data.profile.displayName).toBe("UpdatedPlayer");

        const updatedUser = await getTestDatabase().user.findUnique({
          where: { id: user.id },
        });

        expect(updatedUser?.steamId64).toBe("76561198087654321");
        expect(updatedUser?.steamUsername).toBe("UpdatedPlayer");
        expect(updatedUser?.steamAvatar).toBe(
          "https://example.com/updated-avatar.jpg"
        );
        expect(updatedUser?.steamProfileURL).toBe(
          "https://steamcommunity.com/id/updatedplayer/"
        );
      }
    });

    it("should update steamConnectedAt timestamp when reconnecting with same Steam ID", async () => {
      const originalConnectedAt = new Date("2024-01-01T00:00:00.000Z");
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });

      await getTestDatabase().user.update({
        where: { id: user.id },
        data: { steamConnectedAt: originalConnectedAt },
      });

      const steamId64 = "76561198012345678";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: steamId64, userId: user.id },
        context
      );

      expect(result.success).toBe(true);

      const updatedUser = await getTestDatabase().user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.steamConnectedAt).not.toBeNull();
      expect(updatedUser?.steamConnectedAt?.getTime()).toBeGreaterThan(
        originalConnectedAt.getTime()
      );
    });
  });

  describe("Validation Error Cases", () => {
    it("should return BAD_REQUEST when Steam ID is empty", async () => {
      const user = await createUser();
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: "", userId: user.id },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(result.error).toContain("Steam ID is required");
      }
    });

    it("should return BAD_REQUEST when vanity URL does not exist", async () => {
      const user = await createUser();
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: "nonexistentuser", userId: user.id },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(result.error).toContain("Invalid Steam ID");
      }
    });

    it("should return NOT_FOUND when Steam ID64 does not exist", async () => {
      const user = await createUser();
      const steamId64 = "99999999999999999";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: steamId64, userId: user.id },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.NOT_FOUND);
        expect(result.error).toContain("Steam profile not found");
      }
    });
  });

  describe("Authorization Error Cases", () => {
    it("should return FORBIDDEN when Steam profile is private", async () => {
      const user = await createUser();
      const steamId64 = "76561198099999999";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: steamId64, userId: user.id },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.FORBIDDEN);
        expect(result.error).toContain(
          "Your Steam profile game details are set to private"
        );
        expect(result.error).toContain("To import your library");
        expect(result.error).toContain("Steam Privacy Settings");
      }
    });
  });

  describe("Rate Limiting", () => {
    it("should return TOO_MANY_REQUESTS after exceeding rate limit", async () => {
      const user = await createUser();
      const steamId64 = "76561198012345678";
      const ip = getUniqueIP();
      const context = createMockContext(ip);

      for (let i = 0; i < 20; i++) {
        const result = await connectSteamHandler(
          { steamId: steamId64, userId: user.id },
          context
        );
        expect(result.success).toBe(true);
      }

      const result = await connectSteamHandler(
        { steamId: steamId64, userId: user.id },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
        expect(result.error).toBe("Rate limit exceeded. Try again later.");
        expect(result.headers).toBeDefined();
        expect(result.headers?.["X-RateLimit-Limit"]).toBe("20");
        expect(result.headers?.["X-RateLimit-Remaining"]).toBe("0");
        expect(result.headers?.["Retry-After"]).toBeDefined();
      }
    });
  });

  describe("External Service Error Cases", () => {
    it("should return SERVICE_UNAVAILABLE when Steam API is unavailable", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const user = await createUser();
      const steamId64 = "76561198012345678";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: steamId64, userId: user.id },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
        expect(result.error).toBe(
          "Steam is temporarily unavailable. Please try again later."
        );
      }
    });

    it("should return BAD_REQUEST when vanity URL resolution fails", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const user = await createUser();
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: "somecustomurl", userId: user.id },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(result.error).toContain("Invalid Steam ID");
      }
    });
  });

  describe("Database Error Cases", () => {
    it("should return INTERNAL_SERVER_ERROR when User does not exist", async () => {
      const nonExistentUserId = "00000000-0000-0000-0000-000000000000";
      const steamId64 = "76561198012345678";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: steamId64, userId: nonExistentUserId },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(result.error).toContain("Failed to connect Steam account");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle Steam ID64 with leading/trailing whitespace", async () => {
      const user = await createUser();
      const steamId64WithWhitespace = "  76561198012345678  ";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: steamId64WithWhitespace, userId: user.id },
        context
      );

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.profile.steamId64).toBe("76561198012345678");

        const updatedUser = await getTestDatabase().user.findUnique({
          where: { id: user.id },
        });

        expect(updatedUser?.steamId64).toBe("76561198012345678");
      }
    });

    it("should preserve other User fields when connecting Steam", async () => {
      const user = await createUser({
        email: "test@example.com",
        name: "Test User",
        username: "testuser",
        usernameNormalized: "testuser",
      });

      const steamId64 = "76561198012345678";
      const context = createMockContext(getUniqueIP());

      const result = await connectSteamHandler(
        { steamId: steamId64, userId: user.id },
        context
      );

      expect(result.success).toBe(true);

      const updatedUser = await getTestDatabase().user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.email).toBe("test@example.com");
      expect(updatedUser?.name).toBe("Test User");
      expect(updatedUser?.username).toBe("testuser");
      expect(updatedUser?.usernameNormalized).toBe("testuser");
      expect(updatedUser?.steamId64).toBe("76561198012345678");
    });

    it("should handle multiple different users connecting different Steam accounts", async () => {
      const user1 = await createUser({ username: "user1" });
      const user2 = await createUser({ username: "user2" });

      const context1 = createMockContext(getUniqueIP());
      const context2 = createMockContext(getUniqueIP());

      const result1 = await connectSteamHandler(
        { steamId: "76561198012345678", userId: user1.id },
        context1
      );

      const result2 = await connectSteamHandler(
        { steamId: "76561198087654321", userId: user2.id },
        context2
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      const updatedUser1 = await getTestDatabase().user.findUnique({
        where: { id: user1.id },
      });
      const updatedUser2 = await getTestDatabase().user.findUnique({
        where: { id: user2.id },
      });

      expect(updatedUser1?.steamId64).toBe("76561198012345678");
      expect(updatedUser1?.steamUsername).toBe("TestPlayer");

      expect(updatedUser2?.steamId64).toBe("76561198087654321");
      expect(updatedUser2?.steamUsername).toBe("UpdatedPlayer");
    });
  });
});
