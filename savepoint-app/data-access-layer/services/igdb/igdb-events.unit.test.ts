import { ServiceErrorCode } from "../types";
import { IgdbService } from "./igdb-service";

vi.mock("@/env.mjs", () => ({
  env: {
    IGDB_CLIENT_ID: "test-client-id",
    IGDB_CLIENT_SECRET: "test-client-secret",
  },
}));

const mockFetch = vi.fn();
Object.defineProperty(global, "fetch", {
  writable: true,
  value: mockFetch,
});

describe("IgdbService", () => {
  let service: IgdbService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    service = new IgdbService();
  });

  describe("getUpcomingReleasesByIds", () => {
    describe("when service returns", () => {
      it("should return upcoming releases when valid game IDs are provided", async () => {
        const params = { ids: [1234, 5678, 9012] };
        const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30;
        const mockReleases = [
          {
            id: 1234,
            name: "Future Game 1",
            cover: { id: 1, image_id: "cover1" },
            first_release_date: futureTimestamp,
            release_dates: [
              {
                id: 1,
                human: "2025-Q4",
                platform: { id: 6, name: "PC", human: "2025-Q4" },
              },
            ],
          },
          {
            id: 5678,
            name: "Future Game 2",
            cover: { id: 2, image_id: "cover2" },
            first_release_date: futureTimestamp + 86400 * 15,
            release_dates: [
              {
                id: 2,
                human: "2026-Q1",
                platform: { id: 48, name: "PlayStation 5", human: "2026-Q1" },
              },
            ],
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReleases,
        });

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.releases).toHaveLength(2);
          expect(result.data.releases[0].id).toBe(1234);
          expect(result.data.releases[0].name).toBe("Future Game 1");
          expect(result.data.releases[1].id).toBe(5678);
          expect(result.data.releases[1].name).toBe("Future Game 2");
        }
      });

      it("should return empty array when no upcoming releases found", async () => {
        const params = { ids: [1234, 5678] };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.releases).toEqual([]);
        }
      });

      it("should handle single game ID", async () => {
        const params = { ids: [1234] };
        const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30;
        const mockReleases = [
          {
            id: 1234,
            name: "Future Game",
            cover: { id: 1, image_id: "cover1" },
            first_release_date: futureTimestamp,
            release_dates: [],
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReleases,
        });

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.releases).toHaveLength(1);
          expect(result.data.releases[0].id).toBe(1234);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when IDs array is empty", async () => {
        const params = { ids: [] };

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("At least one game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when ids is undefined", async () => {
        const params = { ids: undefined as unknown as number[] };

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("At least one game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when any ID is invalid (0)", async () => {
        const params = { ids: [1234, 0, 5678] };

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("valid positive integers");
        }
      });

      it("should return VALIDATION_ERROR when any ID is negative", async () => {
        const params = { ids: [1234, -100, 5678] };

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("valid positive integers");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        const params = { ids: [1234, 5678] };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch upcoming releases");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { ids: [1234, 5678] };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when API returns undefined", async () => {
        const params = { ids: [1234, 5678] };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => undefined,
        });

        const result = await service.getUpcomingReleasesByIds(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch upcoming releases");
        }
      });
    });
  });

  describe("getUpcomingGamingEvents", () => {
    describe("when service returns", () => {
      it("should return upcoming events when API call succeeds", async () => {
        const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;
        const mockEvents = [
          {
            id: 1,
            name: "Summer Game Fest 2025",
            start_time: futureTimestamp,
            end_time: futureTimestamp + 7200,
            checksum: "abc123",
            created_at: 1609459200,
            description: "Annual gaming event",
            event_logo: { id: 100 },
            event_networks: [1, 2, 3],
            games: [1000, 1001],
            live_stream_url: "https://example.com/stream",
            slug: "summer-game-fest-2025",
            time_zone: "America/Los_Angeles",
            updated_at: 1609459300,
            videos: [1, 2],
          },
          {
            id: 2,
            name: "E3 2025",
            start_time: futureTimestamp + 86400,
            end_time: futureTimestamp + 86400 + 7200,
            checksum: "def456",
            created_at: 1609459400,
            description: "Electronic Entertainment Expo",
            event_logo: 101,
            event_networks: [4, 5],
            games: [2000, 2001, 2002],
            slug: "e3-2025",
            time_zone: "America/Los_Angeles",
            updated_at: 1609459500,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvents,
        });

        const result = await service.getUpcomingGamingEvents();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.events).toHaveLength(2);
          expect(result.data.events[0].name).toBe("Summer Game Fest 2025");
          expect(result.data.events[0].start_time).toBe(futureTimestamp);
          expect(result.data.events[1].name).toBe("E3 2025");
          expect(result.data.events[1].start_time).toBe(
            futureTimestamp + 86400
          );
        }
      });

      it("should return empty array when no upcoming events exist", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getUpcomingGamingEvents();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.events).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const result = await service.getUpcomingGamingEvents();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain(
            "Failed to fetch upcoming gaming events"
          );
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getUpcomingGamingEvents();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when API returns undefined", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => undefined,
        });

        const result = await service.getUpcomingGamingEvents();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain(
            "Failed to fetch upcoming gaming events"
          );
        }
      });
    });
  });

  describe("getEventLogo", () => {
    describe("when service returns", () => {
      it("should return event logo when valid logo ID is provided", async () => {
        const params = { logoId: 12345 };
        const mockLogo = {
          id: 12345,
          width: 800,
          height: 400,
          image_id: "event_logo_abc123",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [mockLogo],
        });

        const result = await service.getEventLogo(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.logo.id).toBe(12345);
          expect(result.data.logo.width).toBe(800);
          expect(result.data.logo.height).toBe(400);
          expect(result.data.logo.image_id).toBe("event_logo_abc123");
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when logo ID is null", async () => {
        const params = { logoId: null as unknown as number };

        const result = await service.getEventLogo(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid event logo ID is required");
        }
      });

      it("should return VALIDATION_ERROR when logo ID is zero or negative", async () => {
        const params = { logoId: 0 };

        const result = await service.getEventLogo(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid event logo ID is required");
        }
      });

      it("should return NOT_FOUND when logo does not exist", async () => {
        const params = { logoId: 999999 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getEventLogo(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toContain("Event logo with ID 999999 not found");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        const params = { logoId: 12345 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const result = await service.getEventLogo(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch event logo");
        }
      });
    });
  });
});
