export { addToLibraryAction } from "./server-actions/add-to-library-action";
export { updateLibraryEntryAction } from "./server-actions/update-library-entry-action";
export { updateLibraryStatusAction } from "./server-actions/update-library-status-action";
export { deleteLibraryItemAction } from "./server-actions/delete-library-item";
export { getLibraryStatusForGames } from "./server-actions/get-library-status-for-games";
export { quickAddToLibraryAction } from "./server-actions/quick-add-to-library-action";

export {
  addGameToLibrary,
  type AddGameToLibraryInput,
  type AddGameToLibraryResult,
} from "./use-cases/add-game-to-library";
export {
  getPlatformsForLibraryModal,
  type GetPlatformsForLibraryModalInput,
  type GetPlatformsForLibraryModalResult,
} from "./use-cases/get-platforms-for-library-modal";
