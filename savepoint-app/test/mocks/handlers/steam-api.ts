import { http, HttpResponse } from "msw";

import type { SteamProfile } from "@/features/steam-import/types";

export const defaultSteamProfile: SteamProfile = {
  steamId64: "76561198012345678",
  displayName: "TestUser",
  avatarUrl: "https://example.com/avatar.jpg",
  profileUrl: "https://steamcommunity.com/profiles/76561198012345678",
};

export const steamApiHandlers = [
  http.post("/api/steam/connect", async ({ request }) => {
    const body = (await request.json()) as { steamId: string };

    if (!body.steamId) {
      return HttpResponse.json(
        { error: "Steam ID is required" },
        { status: 400 }
      );
    }

    if (body.steamId === "invalid") {
      return HttpResponse.json({ error: "Invalid Steam ID" }, { status: 400 });
    }

    return HttpResponse.json({ profile: defaultSteamProfile });
  }),
];
