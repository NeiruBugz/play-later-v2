"use client";

import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";
import { addImportedGame } from "@/src/features/add-game/api/add-imported-game";
import { useIGDBSearchMutation } from "@/src/features/search/api/use-search";
import { fetchSteamProfile } from "@/src/features/steam-import/api/fetch-steam-profile.action";
import { useImportedGames } from "@/src/features/steam-import/lib/use-imported-games";
import { ImportedGameItem } from "@/src/features/steam-import/ui/imported-game-item";
import { cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import { Button, Input } from "@/src/shared/ui";
import {
  AcquisitionType,
  BacklogItemStatus,
  IgnoredImportedGames,
  User,
} from "@prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
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
      Fetch profile
    </Button>
  );
}

function GameInfo({ gameCount }: { gameCount: number }) {
  if (gameCount === 0) return null;

  return (
    <>
      <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
        We&apos;ve found {gameCount} games in your Steam profile
      </h3>
      <p className="my-2 mt-6 leading-7">
        Also, we&apos;ve filtered games that you already logged into the app
        with PC as a platform and merged different clients of the game (e.g.
        Call of Duty and Call of Duty Multiplayer)
      </p>
    </>
  );
}

function ImportDialog({
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
  const { mutateAsync } = useIGDBSearchMutation();

  useEffect(() => {
    if (processedGames.length !== games.length && processedGames.length !== 0) {
      setGames(processedGames);
    }
  }, [games.length, processedGames]);

  const totalPages = Math.ceil(processedGames.length / 10);

  const paginatedGames = useMemo(() => {
    if (!games.length) return [];
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return games.slice(startIndex, endIndex);
  }, [page, games]);

  const goToFirst = useCallback(() => {
    setPage(1);
  }, []);

  const goToLast = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const changeSteamAppStatus = useCallback(
    (appId: number, status: string) => {
      const updated = games.map((game) => {
        if (game.appid === appId) {
          return {
            ...game,
            status: status as unknown as BacklogItemStatus,
          };
        }

        return game;
      });
      setGames(updated);
    },
    [games]
  );

  const getIgdbInfo = useCallback(
    async (name: string) => {
      try {
        const igdbInfo = await mutateAsync(name);
        if (!igdbInfo.length) {
          return false;
        }
        const game = igdbInfo.find((igdbGame) =>
          areStringsLooselyEquivalent(igdbGame.name, name)
        );

        if (!game) {
          return false;
        }
        return game;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    [mutateAsync]
  );

  const onSaveClick = useCallback(
    async (steamGame: SteamAppInfo) => {
      try {
        const igdbInfo = await getIgdbInfo(
          steamGame.name.replace(/[\u2122\u00A9\u00AE]/g, "").trim()
        );
        const gameStatus = games.find((game) => game.appid === steamGame.appid);
        if (!igdbInfo) {
          await addImportedGame({
            game: {
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
            },
            backlogItem: {
              backlogStatus: gameStatus?.status || BacklogItemStatus.TO_PLAY,
              acquisitionType: AcquisitionType.DIGITAL,
              platform: "PC",
            },
          });
          setGames((prevState) =>
            prevState.filter((game) => game.appid !== steamGame.appid)
          );
          return;
        } else {
          await addImportedGame({
            game: {
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
            },
            backlogItem: {
              backlogStatus: gameStatus?.status || BacklogItemStatus.TO_PLAY,
              acquisitionType: AcquisitionType.DIGITAL,
              platform: "PC",
            },
          });
          setGames((prevState) =>
            prevState.filter((game) => game.appid !== steamGame.appid)
          );
        }
      } catch (error) {
        console.log(error);
      }
    },
    [games, getIgdbInfo]
  );

  return (
    <>
      <div className="my-3">
        <form action={action} className="mb-4 flex items-center gap-2">
          <Input
            placeholder="Enter Steam profile URL"
            name="steamProfileUrl"
            disabled={state.gameCount !== 0}
            defaultValue={userData?.steamProfileURL ?? ""}
            type="text"
          />
          <FetchSteamProfileButton isDisabled={state.gameCount !== 0} />
        </form>
        <GameInfo gameCount={state.gameCount} />
        <div className="">
          <ul className="max-h-[520px] w-full overflow-auto lg:max-w-full">
            {paginatedGames.map((game) => {
              return (
                <li key={game.appid}>
                  <ImportedGameItem
                    game={game}
                    onGameStatusChange={changeSteamAppStatus}
                    onSaveGameClick={onSaveClick}
                  />
                </li>
              );
            })}
          </ul>
          <div
            className={cn("mt-2 flex items-center gap-1 text-xs", {
              hidden: !processedGames.length,
            })}
          >
            <Button
              variant="ghost"
              className="h-6 w-6 p-0"
              disabled={page === 1}
              onClick={goToFirst}
            >
              <ChevronsLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              disabled={!page || page === 1}
              className="h-6 w-6 p-0"
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <span className="font-medium">
              {page ?? 1} | {totalPages}
            </span>

            <Button
              variant="ghost"
              disabled={page >= totalPages}
              className="h-6 w-6 p-0"
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0"
              disabled={page >= totalPages}
              onClick={goToLast}
            >
              <ChevronsRight className="h-5 w-5" />
            </Button>
            <span>Total games: {processedGames.length}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export { ImportDialog };
