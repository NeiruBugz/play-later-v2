export type SteamResolveVanityResponse = {
  response: {
    success: 1 | 42;
    steamid?: string;
    message?: string;
  };
};

export type SteamPlayerSummary = {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarfull: string;
  communityvisibilitystate: number;
  profilestate?: number;
  lastlogoff?: number;
  commentpermission?: number;
};

export type SteamPlayerSummariesResponse = {
  response: {
    players: SteamPlayerSummary[];
  };
};

export type SteamProfile = {
  steamId64: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  isPublic: boolean;
};

export type ResolveVanityUrlInput = {
  vanityUrl: string;
};

export type GetPlayerSummaryInput = {
  steamId64: string;
};

export type ValidateSteamIdInput = {
  input: string;
};

export type SteamOwnedGame = {
  appId: number;
  name: string;
  playtimeForever: number;
  playtimeWindows: number;
  playtimeMac: number;
  playtimeLinux: number;
  imgIconUrl: string | null;
  imgLogoUrl: string | null;
  rtimeLastPlayed: number | null;
};

export type SteamOwnedGamesResponse = {
  response: {
    game_count: number;
    games?: Array<{
      appid: number;
      name: string;
      playtime_forever: number;
      playtime_windows_forever?: number;
      playtime_mac_forever?: number;
      playtime_linux_forever?: number;
      img_icon_url?: string;
      img_logo_url?: string;
      rtime_last_played?: number;
    }>;
  };
};

export type GetOwnedGamesInput = {
  steamId64: string;
};
