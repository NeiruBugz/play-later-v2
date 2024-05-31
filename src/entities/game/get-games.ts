import { GameStatus, type Game, type PurchaseType } from "@prisma/client";
import { getServerUserId } from "@/auth";
import { calculateTotalBacklogTime } from "@/src/packages/library/client-helpers";
import { commonErrorHandler, sessionErrorHandler } from "@/src/packages/utils";
import type {
  FetcherAndProcessor,
  PickerItem,
} from "@/src/types/library/actions";
import { db } from "@/src/shared/api";

type GameFilters = {
  order?: "asc" | "desc";
  purchaseType?: PurchaseType;
  search?: string;
  sortBy?: keyof Game;
  status?: GameStatus;
};

export const getGames = async (filters: GameFilters) => {
  const userId = await getServerUserId();
  const {
    order = "desc",
    purchaseType,
    search = null,
    sortBy = "updatedAt",
    status,
  } = filters;

  console.log(status);

  return db.game.findMany({
    orderBy: { [sortBy]: order },
    select: {
      createdAt: true,
      gameplayTime: true,
      howLongToBeatId: true,
      id: true,
      igdbId: true,
      imageUrl: true,
      status: true,
      title: true,
      updatedAt: true,
    },
    where: {
      deletedAt: null,
      isWishlisted: false,
      purchaseType: purchaseType ? purchaseType : undefined,
      status: status ? status : undefined,
      title: { contains: search || "", mode: "insensitive" },
      userId,
    },
  });
};

export const getGamesListWithAdapter: FetcherAndProcessor = async (params) => {
  const filters: GameFilters = {
    order: (params.get("order") ?? "desc") as GameFilters["order"],
    purchaseType: params.get("purchaseType") as PurchaseType,
    search: params.get("search") || undefined,
    sortBy: (params.get("sortBy") as keyof Game) ?? "updatedAt",
    status: params.get("status") as GameStatus,
  };

  const games = await getGames(filters);

  return { list: games };
};

export type CountsAndBackloggedResponse = {
  backlogged: Array<PickerItem>;
  counts: Record<keyof typeof GameStatus, number>;
};

const emptyResponse: CountsAndBackloggedResponse = {
  backlogged: [],
  counts: {
    [GameStatus.ABANDONED]: 0,
    [GameStatus.BACKLOG]: 0,
    [GameStatus.COMPLETED]: 0,
    [GameStatus.FULL_COMPLETION]: 0,
    [GameStatus.INPROGRESS]: 0,
    [GameStatus.SHELVED]: 0,
  },
};
export const getCountsAndBacklogList =
  async (): Promise<CountsAndBackloggedResponse> => {
    try {
      const session = await getServerUserId();

      if (!session) {
        sessionErrorHandler();
        return emptyResponse;
      }

      const defaultParams = {
        deletedAt: null,
        userId: session,
      };

      const [
        backlogged,
        backlogCount,
        inprogressCount,
        completedCount,
        fullCompletionCount,
        abandonedCount,
        shelvedCount,
      ] = await db.$transaction([
        db.game.findMany({
          select: {
            id: true,
            imageUrl: true,
            title: true,
          },
          where: {
            status: GameStatus.BACKLOG,
            ...defaultParams,
          },
        }),
        ...Object.values(GameStatus).map((status) =>
          db.game.count({ where: { status, ...defaultParams } })
        ),
      ]);

      return {
        backlogged,
        counts: {
          [GameStatus.ABANDONED]: abandonedCount,
          [GameStatus.BACKLOG]: backlogCount,
          [GameStatus.COMPLETED]: completedCount,
          [GameStatus.FULL_COMPLETION]: fullCompletionCount,
          [GameStatus.INPROGRESS]: inprogressCount,
          [GameStatus.SHELVED]: shelvedCount,
        },
      };
    } catch (error) {
      commonErrorHandler("Couldn't find records");
      return emptyResponse;
    }
  };

export const computeBacklogTime = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return {
        time: 0,
      };
    }
    const backlogged = await db.game.findMany({
      select: {
        gameplayTime: true,
      },
      where: {
        deletedAt: null,
        status: GameStatus.BACKLOG,
        userId: session,
      },
    });
    if (!backlogged) {
      return {
        time: 0,
      };
    }

    const totalTime = calculateTotalBacklogTime(backlogged);

    return {
      time: totalTime,
    };
  } catch (error) {
    commonErrorHandler("Couldn't find records");
    return {
      time: 0,
    };
  }
};
