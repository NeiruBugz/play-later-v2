"use server";

import { IgdbService } from "@/data-access-layer/services";
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "loadMoreFranchiseGames",
});
const LoadMoreSchema = z.object({
  franchiseId: z.number().positive(),
  currentGameId: z.number().positive(),
  offset: z.number().min(0),
  limit: z.number().min(1).max(50).default(20),
});
export type LoadMoreResult =
  | {
      success: true;
      data: {
        games: Array<{
          id: number;
          name: string;
          slug: string;
          cover?: { image_id: string };
        }>;
        hasMore: boolean;
        nextOffset: number;
      };
    }
  | {
      success: false;
      error: string;
    };
export async function loadMoreFranchiseGames(
  input: z.infer<typeof LoadMoreSchema>
): Promise<LoadMoreResult> {
  try {
    const validated = LoadMoreSchema.parse(input);
    logger.info(
      { franchiseId: validated.franchiseId, offset: validated.offset },
      "Loading more franchise games"
    );
    const igdbService = new IgdbService();
    const result = await igdbService.getFranchiseGames(validated);
    if (!result.success) {
      logger.error({ error: result.error }, "Failed to fetch franchise games");
      return { success: false, error: result.error };
    }
    logger.info(
      {
        franchiseId: validated.franchiseId,
        gamesCount: result.data.games.length,
        hasMore: result.data.pagination.hasMore,
      },
      "Franchise games loaded successfully"
    );
    return {
      success: true,
      data: {
        games: result.data.games,
        hasMore: result.data.pagination.hasMore,
        nextOffset: validated.offset + validated.limit,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error({ error: error.errors }, "Validation error");
      return { success: false, error: "Invalid input parameters" };
    }
    logger.error({ error }, "Server action failed");
    return { success: false, error: "Failed to load games" };
  }
}
