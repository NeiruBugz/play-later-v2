import { getServerUserId } from "@/auth";
import { prisma } from "@/shared/lib/db";
import {
  AcquisitionType,
  BacklogItem,
  BacklogItemStatus,
} from "@prisma/client";
import {
  AuthenticationError,
  DatabaseError,
  NotFoundError,
} from "../shared/errors";
import { failure, Result, wrapWithResult } from "../shared/result";
import { validateWithZod } from "../shared/validation";
import {
  CreateBacklogItemInput,
  CreateBacklogItemSchema,
  UpdateBacklogItemInput,
  UpdateBacklogItemSchema,
  UpdateBacklogItemStatusInput,
  UpdateBacklogItemStatusSchema,
} from "./types";

export const BacklogItemService = {
  create: async (
    input: CreateBacklogItemInput,
    userId: string
  ): Promise<Result<void, Error>> => {
    // Validate input
    const validationResult = validateWithZod(CreateBacklogItemSchema, input);
    if (validationResult.isFailure) {
      return validationResult;
    }

    const { backlogItem, gameId } = validationResult.value;

    return wrapWithResult(async () => {
      await prisma.backlogItem.create({
        data: {
          status: backlogItem.backlogStatus as BacklogItemStatus,
          acquisitionType: backlogItem.acquisitionType as AcquisitionType,
          platform: backlogItem.platform ? String(backlogItem.platform) : null,
          startedAt: backlogItem.startedAt
            ? new Date(backlogItem.startedAt as string)
            : null,
          completedAt: backlogItem.completedAt
            ? new Date(backlogItem.completedAt as string)
            : null,
          User: {
            connect: {
              id: userId,
            },
          },
          game: {
            connect: {
              id: gameId,
            },
          },
        },
      });

      // Return void as we don't need to return any data
      return;
    }, "Failed to create backlog item");
  },

  delete: async (
    backlogItemId: number,
    userId: string
  ): Promise<Result<void, Error>> => {
    if (!backlogItemId) {
      return failure(new DatabaseError("Backlog item ID is required"));
    }

    return wrapWithResult(async () => {
      // Check if backlog item exists and belongs to the user
      const backlogItem = await prisma.backlogItem.findUnique({
        where: { id: backlogItemId },
        select: { userId: true },
      });

      if (!backlogItem) {
        throw new NotFoundError("BacklogItem", backlogItemId);
      }

      if (backlogItem.userId !== userId) {
        throw new AuthenticationError(
          "You don't have permission to delete this backlog item"
        );
      }

      await prisma.backlogItem.delete({
        where: { id: backlogItemId },
      });

      // Return void as we don't need to return any data
      return;
    }, "Failed to delete backlog item");
  },

  update: async (
    input: UpdateBacklogItemInput,
    userId: string
  ): Promise<Result<void, Error>> => {
    // Validate input
    const validationResult = validateWithZod(UpdateBacklogItemSchema, input);
    if (validationResult.isFailure) {
      return validationResult;
    }

    const validInput = validationResult.value;
    const itemId = Number(validInput.id);

    return wrapWithResult(async () => {
      // Check if backlog item exists and belongs to the user
      const backlogItem = await prisma.backlogItem.findUnique({
        where: { id: itemId },
        select: { userId: true },
      });

      if (!backlogItem) {
        throw new NotFoundError("BacklogItem", itemId);
      }

      if (backlogItem.userId !== userId) {
        throw new AuthenticationError(
          "You don't have permission to update this backlog item"
        );
      }

      await prisma.backlogItem.update({
        where: { id: itemId },
        data: {
          platform: validInput.platform ? String(validInput.platform) : null,
          status: validInput.status as BacklogItemStatus,
          startedAt: validInput.startedAt
            ? validInput.startedAt instanceof Date
              ? validInput.startedAt
              : new Date(validInput.startedAt as string)
            : null,
          completedAt: validInput.completedAt
            ? validInput.completedAt instanceof Date
              ? validInput.completedAt
              : new Date(validInput.completedAt as string)
            : null,
        },
      });

      // Return void as we don't need to return any data
      return;
    }, "Failed to update backlog item");
  },

  updateStatus: async (
    input: UpdateBacklogItemStatusInput,
    userId: string
  ): Promise<Result<void, Error>> => {
    // Validate input
    const validationResult = validateWithZod(
      UpdateBacklogItemStatusSchema,
      input
    );
    if (validationResult.isFailure) {
      return validationResult;
    }

    const validInput = validationResult.value;
    const itemId = Number(validInput.id);

    return wrapWithResult(async () => {
      // Check if backlog item exists and belongs to the user
      const backlogItem = await prisma.backlogItem.findUnique({
        where: { id: itemId },
        select: { userId: true },
      });

      if (!backlogItem) {
        throw new NotFoundError("BacklogItem", itemId);
      }

      if (backlogItem.userId !== userId) {
        throw new AuthenticationError(
          "You don't have permission to update this backlog item"
        );
      }

      await prisma.backlogItem.update({
        where: { id: itemId },
        data: {
          status: validInput.status as BacklogItemStatus,
        },
      });

      // Return void as we don't need to return any data
      return;
    }, "Failed to update backlog item status");
  },

  getBacklogItemsForUserByIgdbId: async (
    igdbId: number
  ): Promise<Result<BacklogItem[], Error>> => {
    const userId = await getServerUserId();

    if (!userId) {
      return failure(new AuthenticationError("User not authenticated"));
    }

    const backlogItems = await prisma.backlogItem.findMany({
      where: { userId, game: { igdbId } },
    });

    return wrapWithResult(async () => {
      return backlogItems;
    }, "Failed to get backlog items for user by IGDB ID");
  },
};
