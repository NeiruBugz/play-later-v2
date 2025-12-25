import { igdbHandlers } from "./igdb";
import { createLibraryHandlers, libraryApiHandlers } from "./library-api";
import { nextApiHandlers } from "./next-api";
import { twitchHandlers } from "./twitch";

export { createLibraryHandlers };

export const allHandlers = [
  ...igdbHandlers,
  ...twitchHandlers,
  ...nextApiHandlers,
  ...libraryApiHandlers,
];
