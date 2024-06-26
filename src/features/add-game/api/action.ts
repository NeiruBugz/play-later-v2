"use server";

import { AddGameToBacklogInput } from "@/src/entities/game";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveGameAndAddToBacklog } from "./add-game";

const CreateGameActionSchema = z.object({
  backlogStatus: z.string().optional(),
  igdbId: z.number(),
  title: z.string(),
  description: z.string().optional(),
  releaseDate: z.number().optional(),
  coverImage: z.string(),
  hltbId: z.string(),
  platform: z.string().optional(),
  mainStory: z.number().optional().default(0),
  mainExtra: z.number().optional().default(0),
  completionist: z.number().optional().default(0),
  acquisitionType: z.enum(["PHYSICAL", "DIGITAL", "SUBSCRIPTION"]),
});

export async function createGameAction(
  prevState: { message: string },
  payload: FormData
) {
  const parsedPayload = CreateGameActionSchema.safeParse({
    backlogStatus: payload.get("backlogStatus"),
    igdbId: Number(payload.get("igdbId")),
    title: payload.get("title"),
    description: payload.get("description"),
    releaseDate: Number(payload.get("releaseDate")),
    coverImage: payload.get("coverImage"),
    hltbId: payload.get("hltbId"),
    mainStory: Number(payload.get("mainStory")),
    mainExtra: Number(payload.get("mainExtra")),
    completionist: Number(payload.get("completionist")),
    acquisitionType: payload.get("acquisitionType"),
    platform: payload.get("platform"),
  });

  if (!parsedPayload.success) {
    console.log(parsedPayload.error.errors);
    return { message: "Failed to save game", isError: true };
  }

  try {
    const preparedPayload = {
      game: {
        igdbId: parsedPayload.data.igdbId,
        title: parsedPayload.data.title,
        description: parsedPayload.data.description ?? "",
        releaseDate: parsedPayload.data.releaseDate
          ? new Date(parsedPayload.data.releaseDate * 1000)
          : null,
        coverImage: parsedPayload.data.coverImage,
        hltbId: parsedPayload.data.hltbId,
        mainStory: parsedPayload.data.mainStory,
        mainExtra: parsedPayload.data.mainExtra,
        completionist: parsedPayload.data.completionist,
      },
      backlogItem: {
        acquisitionType: parsedPayload.data
          .acquisitionType as unknown as AcquisitionType,
        backlogStatus: parsedPayload.data
          .backlogStatus as unknown as BacklogItemStatus,
        platform: parsedPayload.data.platform,
      },
    } satisfies AddGameToBacklogInput;

    await saveGameAndAddToBacklog(preparedPayload);
    revalidatePath("/collection");
    return {
      message: `"${parsedPayload.data.title} saved to your collection"`,
      isError: false,
    };
  } catch (error) {
    return { message: "Failed to save game", isError: true };
  }
}
