"use client";

import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";
import { addIgnoredGame } from "@/src/entities/ignored-game";
import { addImportedGame } from "@/src/features/add-game/api/add-imported-game";
import { useIGDBSearchMutation } from "@/src/features/search/api/use-search";
import { fetchSteamProfile } from "@/src/features/steam-import/api/fetch-steam-profile.action";
import { useImportedGames } from "@/src/features/steam-import/lib/use-imported-games";
import { GameList } from "@/src/features/steam-import/ui/game-list";
import { ImportNotice } from "@/src/features/steam-import/ui/import-notice";
import { PaginationControls } from "@/src/features/steam-import/ui/list-pagination";
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
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

function normalizeString(input: string) {
  return input
    .toLowerCase()
    .replace(/[:\-]/g, "")
    .replace(/\b(?:the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function areStringsLooselyEquivalent(str1: string, str2: string): boolean {
  return normalizeString(str1) === normalizeString(str2);
}

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

function ImportedSteamGameList({
  existingGames,
  ignoredGames,
  userData,
}: {
  existingGames: GameWithBacklogItems[];
  ignoredGames: IgnoredImportedGames[];
  userData: User | undefined;
}) {
  const [state, action] = useActionState(fetchSteamProfile, {
    message: "",
    gameList: [],
    gameCount: 0,
  });
  const [page, setPage] = useState(1);
  const { processedGames } = useImportedGames({
    games: state.gameList,
    ignoredGames,
    existingGames,
  });
  const [games, setGames] = useState(processedGames);
  const { mutateAsync: searchIGDB } = useIGDBSearchMutation();
  const { toast } = useToast();

  useEffect(() => {
    if (processedGames.length !== games.length && processedGames.length !== 0) {
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

  const goToPage = (newPage: number) => {
    setPage((_) => Math.max(1, Math.min(newPage, totalPages)));
  };

  const changeSteamAppStatus = useCallback((appId: number, status: string) => {
    setGames((prevGames) =>
      prevGames.map((game) =>
        game.appid === appId
          ? { ...game, status: status as unknown as BacklogItemStatus }
          : game
      )
    );
  }, []);

  const getIgdbInfo = useCallback(
    async (name: string) => {
      try {
        const igdbResults = await searchIGDB(name);
        if (!igdbResults.length) return false;

        const matchedGame = igdbResults.find((igdbGame) =>
          areStringsLooselyEquivalent(igdbGame.name, name)
        );

        if (!matchedGame) {
          toast({
            title: "Steam game import",
            description: "Could not find matching game in IGDB",
          });
        }

        return matchedGame || false;
      } catch (error) {
        console.error("IGDB Search Error:", error);
        toast({
          title: "Steam game import",
          description: "Failed to fetch data from IGDB",
        });
        return false;
      }
    },
    [searchIGDB, toast]
  );

  const onSaveClick = useCallback(
    async (steamGame: SteamAppInfo) => {
      try {
        const cleanedName = steamGame.name
          .replace(/[\u2122\u00A9\u00AE]/g, "")
          .trim();
        const igdbInfo = await getIgdbInfo(cleanedName);
        const gameStatus =
          games.find((game) => game.appid === steamGame.appid)?.status ||
          BacklogItemStatus.TO_PLAY;

        const gameData = igdbInfo
          ? {
              igdbId: igdbInfo.id,
              hltbId: null,
              title: steamGame.name,
              description: igdbInfo.summary,
              coverImage: igdbInfo.cover.image_id,
              releaseDate: new Date(igdbInfo.first_release_date * 1000),
              mainStory: null,
              mainExtra: null,
              completionist: null,
              steamAppId: steamGame.appid,
            }
          : {
              igdbId: 0,
              hltbId: null,
              title: steamGame.name,
              description: null,
              coverImage: null,
              releaseDate: null,
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
            platform: "PC",
          },
        });

        setGames((prevGames) =>
          prevGames.filter((game) => game.appid !== steamGame.appid)
        );
        toast({
          title: "Steam game import",
          description: `Saved ${steamGame.name} to your collection`,
        });
      } catch (error) {
        console.error("Error saving game:", error);
        toast({
          title: "Steam game import",
          description: `Failed to save ${steamGame.name} to your collection`,
        });
      }
    },
    [games, getIgdbInfo, toast]
  );

  const onIgnoreClick = useCallback(
    async (steamGame: SteamAppInfo) => {
      try {
        await addIgnoredGame({ name: steamGame.name });
        setGames((prevState) =>
          prevState.filter((game) => game.appid !== steamGame.appid)
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
    },
    [toast]
  );

  return (
    <>
      <div className="my-3">
        <form action={action} className="mb-4 flex max-w-2xl gap-4">
          <Input
            placeholder="Enter Steam profile URL"
            name="steamProfileUrl"
            disabled={state.gameCount !== 0}
            defaultValue={userData?.steamProfileURL ?? ""}
            type="text"
            className="flex-1"
          />
          <FetchSteamProfileButton isDisabled={state.gameCount !== 0} />
        </form>
        <ImportNotice gameCount={state.gameCount} />
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
              onChangeStatus={changeSteamAppStatus}
              onSaveGame={onSaveClick}
              onIgnoreClick={onIgnoreClick}
            />
            {totalPages > 1 && (
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

export { ImportedSteamGameList as ImportDialog };
