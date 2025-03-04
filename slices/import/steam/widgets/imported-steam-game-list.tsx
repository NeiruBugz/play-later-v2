"use client";

import type { GameWithBacklogItems } from "@/slices/backlog/api/get/get-user-games-with-grouped-backlog";
import { GameList } from "@/slices/import/steam/widgets/game-list";
import { PaginationControls } from "@/slices/import/steam/widgets/list-pagination";
import { addIgnoredGame } from "@/src/entities/ignored-game";
import { addImportedGame } from "@/src/features/add-game/api/add-imported-game";
import { useIGDBSearchMutation } from "@/src/features/search/api/use-search";
import { fetchSteamProfile } from "@/src/features/steam-import/api/fetch-steam-profile.action";
import { cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import { Button, Input } from "@/src/shared/ui";
import { useToast } from "@/src/shared/ui/use-toast";
import {
  AcquisitionType,
  BacklogItemStatus,
  IgnoredImportedGames,
  User,
} from "@prisma/client";
import Fuse from "fuse.js";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useFormStatus } from "react-dom";
import { useImportedGames } from "../lib/use-imported-games";
import { ImportNotice } from "./import-notice";

/** Normalize string for comparison. */
function normalizeString(input: string) {
  return input
    .toLowerCase()
    .replace(/[:\-]/g, "")
    .replace(/\b(?:the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/™|®|:|-|,|\.|\s+/g, " ")
    .trim();
}

/** Perform fuzzy matching to find the best match. */
function findBestMatch(
  query: string,
  items: { name: string }[]
): { name: string } | null {
  const fuse = new Fuse(items, {
    keys: ["name"], // Search within the `name` field.
    threshold: 0.3, // Adjust this threshold for stricter or looser matches.
    distance: 100, // Maximum distance for string comparison.
  });

  const normalizedQuery = normalizeString(query);
  const results = fuse.search(normalizedQuery);

  return results.length ? results[0].item : null;
}

/** Check if two strings are loosely equivalent. */
function areStringsLooselyEquivalent(str1: string, str2: string): boolean {
  return normalizeString(str1) === normalizeString(str2);
}

/** Fetch Steam profile button with loading state. */
function FetchSteamProfileButton({ isDisabled }: { isDisabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      className={cn({ "animate-pulse": pending })}
    >
      {pending ? "Importing..." : "Fetch profile"}
    </Button>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  count: number;
  totalCount: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  count,
  totalCount,
  className,
}) => {
  const progress = Math.min(Math.max(value / max, 0), 1) * 100; // Clamp between 0 and 100

  return (
    <div className={cn("relative my-2 h-[100px] w-full", {}, className)}>
      <div className="mb-1 flex justify-between">
        <span className="text-sm text-white">{`${count} / ${totalCount}`}</span>
        <span className="text-sm text-white">{`${Math.round(progress)}%`}</span>
      </div>
      <div className="h-2 w-full rounded bg-gray-200">
        <div
          className="h-full rounded bg-blue-500"
          style={{ width: `${progress}%`, transition: "width 0.3s ease" }}
        />
      </div>
    </div>
  );
};

/** Get IGDB information for a game. */
async function fetchIgdbInfo(
  name: string,
  platformId: number,
  searchIGDB: ReturnType<typeof useIGDBSearchMutation>["mutateAsync"],
  toast: ReturnType<typeof useToast>["toast"]
) {
  console.log({
    name,
    normalized: normalizeString(name),
    normalizeTitle: normalizeTitle(name),
  });
  try {
    const igdbResults = await searchIGDB({
      query: normalizeTitle(name),
      filters: { platforms: platformId },
    });

    console.log({ igdbResults });

    if (!igdbResults || !igdbResults.length) {
      return;
    }

    const matchedGame = igdbResults.find((igdbGame) =>
      areStringsLooselyEquivalent(igdbGame.name, normalizeTitle(name))
    );

    console.log({ matchedGame });

    if (!matchedGame) {
      toast({
        title: "Steam game import",
        description: `Could not find matching game for ${name}  in IGDB`,
      });
    }

    return matchedGame;
  } catch (error) {
    console.error("IGDB Search Error:", error);
    toast({
      title: "Steam game import",
      description: "Failed to fetch data from IGDB",
    });
    return;
  }
}

/** Save a Steam game to the user's collection. */
async function saveSteamGame(
  steamGame: SteamAppInfo,
  games: (SteamAppInfo & {
    status: BacklogItemStatus;
  })[],
  platformId: number,
  searchIGDB: ReturnType<typeof useIGDBSearchMutation>["mutateAsync"],
  toast: ReturnType<typeof useToast>["toast"],
  setGames: Dispatch<
    SetStateAction<
      (SteamAppInfo & {
        status: BacklogItemStatus;
      })[]
    >
  >,
  isBatch?: boolean
) {
  try {
    const igdbInfo = await fetchIgdbInfo(
      steamGame.name,
      platformId,
      searchIGDB,
      toast
    );

    if (!igdbInfo) {
      toast({
        title: "Steam game import",
        description: `Could not find matching game for ${steamGame.name}  in IGDB`,
        variant: "destructive",
      });
      return;
    }
    const gameStatus =
      games.find((game) => game.appid === steamGame.appid)?.status ||
      BacklogItemStatus.TO_PLAY;

    const gameData = {
      igdbId: igdbInfo?.id || 0,
      hltbId: null,
      title: steamGame.name,
      description: igdbInfo?.summary || null,
      coverImage: igdbInfo?.cover?.image_id || null,
      releaseDate: igdbInfo?.first_release_date
        ? new Date(igdbInfo.first_release_date * 1000)
        : null,
      mainStory: null,
      mainExtra: null,
      completionist: null,
      steamAppId: steamGame.appid,
    };

    await addImportedGame({
      game: gameData,
      backlogItem: {
        backlogStatus: gameStatus,
        acquisitionType: AcquisitionType.DIGITAL,
        platform: "pc",
      },
    });

    setGames((prevGames) =>
      prevGames.filter((game) => game.appid !== steamGame.appid)
    );
    if (!isBatch) {
      toast({
        title: "Steam game import",
        description: `Saved ${steamGame.name} to your collection`,
      });
    }
  } catch (error) {
    console.error("Error saving game:", error);
    if (!isBatch) {
      toast({
        title: "Steam game import",
        description: `Failed to save ${steamGame.name} to your collection`,
      });
    }
  }
}

/** Ignore a Steam game and add it to the ignored games list. */
async function ignoreSteamGame(
  steamGame: SteamAppInfo,
  toast: ReturnType<typeof useToast>["toast"],
  setGames: Dispatch<
    SetStateAction<
      (SteamAppInfo & {
        status: BacklogItemStatus;
      })[]
    >
  >
) {
  try {
    await addIgnoredGame({ name: steamGame.name });
    setGames((prevGames) =>
      prevGames.filter((game) => game.appid !== steamGame.appid)
    );
    toast({
      title: "Steam game import",
      description: `Saved ${steamGame.name} to your ignored games list`,
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Steam game import",
      description: `Failed to save ${steamGame.name} to your ignored games list`,
    });
  }
}

/** Main component for importing and displaying Steam games. */
function ImportedSteamGameList({
  existingGames,
  ignoredGames,
  userData,
  platformId = 6,
}: {
  existingGames: GameWithBacklogItems[];
  ignoredGames: IgnoredImportedGames[];
  userData: User | undefined;
  platformId: number;
}) {
  const [state, fetchSteamProfileFormAction] = useActionState(
    fetchSteamProfile,
    {
      message: "",
      gameList: [],
      gameCount: 0,
    }
  );
  const [page, setPage] = useState(1);
  const { processedGames } = useImportedGames({
    games: state.gameList,
    ignoredGames,
    existingGames,
  });
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [games, setGames] = useState(processedGames);
  const { mutateAsync: searchIGDB } = useIGDBSearchMutation();
  const { toast } = useToast();
  const cancelRef = useRef(false); // Ref to track cancellation

  useEffect(() => {
    if (processedGames.length !== games.length && processedGames.length > 0) {
      setGames(processedGames);
    }
  }, [processedGames, games.length]);

  const totalPages = useMemo(
    () => Math.ceil(processedGames.length / 10),
    [processedGames.length]
  );

  const paginatedGames = useMemo(() => {
    const startIndex = (page - 1) * 10;
    return games.slice(startIndex, startIndex + 10);
  }, [page, games]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setProgress(0);
    setProcessedCount(0);
    cancelRef.current = false;
    const totalGames = games.length;
    const errors: string[] = [];

    for (let i = 0; i < totalGames; i++) {
      if (cancelRef.current) {
        toast({
          title: "Import Stopped",
          description: `Process stopped. ${i} of ${totalGames} games saved.`,
          variant: "default",
        });
        setIsSaving(false);
        setProgress(0); // Reset progress
        return;
      }
      const game = games[i];
      try {
        await saveSteamGame(
          game,
          games,
          platformId,
          searchIGDB,
          toast,
          setGames,
          true
        );
        setProcessedCount(i + 1);
      } catch (error) {
        errors.push(game.name);
      }
      setProgress(Math.round(((i + 1) / totalGames) * 100));
    }

    if (errors.length > 0) {
      toast({
        title: "Save All Completed",
        description: `${totalGames - errors.length} games saved. ${errors.length} failed.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Save All Completed",
        description: "All games saved successfully!",
      });
    }

    setIsSaving(false);
    setProgress(0); // Reset progress bar.
    setProcessedCount(0);
  };
  const handleStopImport = () => {
    cancelRef.current = true;
  };

  return (
    <div className="my-3">
      <form
        action={fetchSteamProfileFormAction}
        className="mb-4 flex min-w-full max-w-2xl gap-4"
      >
        <Input
          placeholder="Enter Steam profile URL"
          name="steamProfileUrl"
          disabled={state.gameCount !== 0 || isSaving}
          defaultValue={userData?.steamProfileURL ?? ""}
          type="text"
          className="flex-1"
        />
        <FetchSteamProfileButton
          isDisabled={state.gameCount !== 0 || isSaving}
        />
      </form>
      <ImportNotice gameCount={state.gameCount} />
      {state.gameCount ? (
        <div className="flex flex-col items-start gap-2">
          <div className="flex gap-2">
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={cn("relative", { "animate-pulse": isSaving })}
            >
              Save all to backlog
            </Button>
            {isSaving && (
              <Button
                variant="destructive"
                onClick={handleStopImport}
                className="relative"
              >
                Stop Import
              </Button>
            )}
          </div>
          {isSaving && (
            <ProgressBar
              value={progress}
              max={100}
              count={processedCount}
              totalCount={games.length}
              className="w-full rounded"
            />
          )}
        </div>
      ) : null}
      {state.gameCount > 0 && (
        <>
          <div className="my-2 flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Steam Games
            </h2>
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
          </div>
          <GameList
            games={paginatedGames}
            onChangeStatus={(appId, status) =>
              setGames((prev) =>
                prev.map((game) =>
                  game.appid === appId
                    ? { ...game, status: status as BacklogItemStatus }
                    : game
                )
              )
            }
            onSaveGame={(game) =>
              saveSteamGame(
                game,
                games,
                platformId,
                searchIGDB,
                toast,
                setGames
              )
            }
            onIgnoreClick={(game) => ignoreSteamGame(game, toast, setGames)}
          />
          {totalPages > 1 && (
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) =>
                setPage((_) => Math.max(1, Math.min(newPage, totalPages)))
              }
            />
          )}
        </>
      )}
    </div>
  );
}

export { ImportedSteamGameList as ImportDialog };
