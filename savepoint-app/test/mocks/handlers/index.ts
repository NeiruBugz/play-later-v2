import { igdbHandlers } from "./igdb";
import { createLibraryHandlers, libraryApiHandlers } from "./library-api";
import { nextApiHandlers } from "./next-api";
import { defaultSteamProfile, steamApiHandlers } from "./steam-api";
import { twitchHandlers } from "./twitch";

export { createLibraryHandlers, defaultSteamProfile };

export const allHandlers = [
  ...igdbHandlers,
  ...twitchHandlers,
  ...nextApiHandlers,
  ...libraryApiHandlers,
  ...steamApiHandlers,
];
