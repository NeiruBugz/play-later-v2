import { env } from "@/env.mjs";

export interface SteamAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name?: string;
  description?: string;
}

export interface SteamAchievementSchema {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
}

export interface SteamPlayerAchievements {
  steamID: string;
  gameName: string;
  achievements: SteamAchievement[];
  success: boolean;
}

export interface SteamGameSchema {
  game: {
    gameName: string;
    gameVersion: string;
    availableGameStats: {
      achievements: SteamAchievementSchema[];
    };
  };
}

export interface SteamGlobalAchievementPercentages {
  achievementpercentages: {
    achievements: Array<{
      name: string;
      percent: number;
    }>;
  };
}

export interface SteamUserOwnedGames {
  game_count: number;
  games: SteamGame[];
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
}

export class SteamWebAPI {
  private apiKey: string;
  private baseUrl = "https://api.steampowered.com";

  constructor() {
    this.apiKey = env.STEAM_API_KEY;
  }
  async getGameAchievementSchema(
    appId: number
  ): Promise<SteamGameSchema | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ISteamUserStats/GetSchemaForGame/v2/?key=${this.apiKey}&appid=${appId}`
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch achievement schema:", error);
      return null;
    }
  }

  async getUserAchievements(
    steamId: string,
    appId: number
  ): Promise<SteamPlayerAchievements | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ISteamUserStats/GetPlayerAchievements/v1/?key=${this.apiKey}&steamid=${steamId}&appid=${appId}`
      );

      if (!response.ok) return null;
      const data = await response.json();
      return data.playerstats;
    } catch (error) {
      console.error("Failed to fetch user achievements:", error);
      return null;
    }
  }

  async getGlobalAchievementPercentages(
    appId: number
  ): Promise<SteamGlobalAchievementPercentages | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?appid=${appId}`
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch global achievement percentages:", error);
      return null;
    }
  }

  async getUserOwnedGames(
    steamId: string
  ): Promise<{ response: SteamUserOwnedGames } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/IPlayerService/GetOwnedGames/v1/?key=${this.apiKey}&steamid=${steamId}&include_appinfo=1`
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch user owned games:", error);
      return null;
    }
  }
}

export const steamWebAPI = new SteamWebAPI();
