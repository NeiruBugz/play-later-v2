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
