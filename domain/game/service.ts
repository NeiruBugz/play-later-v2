import { Game } from "@prisma/client";

import { prisma } from "@/shared/lib/db";

import { DatabaseError, ValidationError } from "../shared/errors";
import { Result, wrapWithResult } from "../shared/result";
import { validateWithZod } from "../shared/validation";
import { CreateGameInput, CreateGameSchema, GameSchema } from "./types";

export const GameService = {
  create: async (
    input: CreateGameInput
  ): Promise<Result<{ createdGame: Game }, Error>> => {
    // Validate input
    const validationResult = validateWithZod(CreateGameSchema, input);
    if (validationResult.isFailure) {
      return validationResult;
    }

    const { game } = validationResult.value;

    return wrapWithResult(async () => {
      const createdGame = await prisma.game.create({
        data: {
          igdbId: Number(game.igdbId),
          title: game.title,
          coverImage: game.coverImage,
          hltbId: game.hltbId === "" ? null : game.hltbId,
          mainExtra: game.mainExtra ? Number(game.mainExtra) : null,
          mainStory: game.mainStory ? Number(game.mainStory) : null,
          completionist: game.completionist ? Number(game.completionist) : null,
          releaseDate: game.releaseDate ? new Date(game.releaseDate) : null,
          description: game.description,
        },
      });

      return { createdGame };
    }, "Failed to create game");
  },

  isExisting: async (
    igdbId: string | number
  ): Promise<Result<Game | boolean, Error>> => {
    return wrapWithResult(async () => {
      const game = await prisma.game.findUnique({
        where: { igdbId: Number(igdbId) },
      });

      if (!game) {
        return false;
      }

      return game;
    }, `Failed to check if game with IGDB ID ${igdbId} exists`);
  },

  findByIgdbId: async (
    igdbId: string | number
  ): Promise<Result<Game | null, DatabaseError>> => {
    if (!igdbId) {
      return wrapWithResult(
        async () => Promise.reject(new ValidationError("IGDB ID is required")),
        "Invalid IGDB ID"
      );
    }

    return wrapWithResult(async () => {
      return prisma.game.findUnique({
        where: { igdbId: Number(igdbId) },
      });
    }, `Failed to find game with IGDB ID ${igdbId}`);
  },
};
