import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { igdbContextFromThrown } from "./errors";
import { igdbFetch } from "./fetch";

const logger = createLogger({ service: "igdb-get-games-release-info" });

const CHUNK_SIZE = 100;
const PAUSE_BETWEEN_CHUNKS_MS = 300;

const RELEASE_INFO_FIELDS = [
  "first_release_date",
  "release_dates.date",
  "release_dates.date_format",
  "release_dates.y",
  "release_dates.m",
] as const;

const GameReleaseInfoSchema = z.object({
  id: z.number(),
  first_release_date: z.number().nullable().optional(),
  release_dates: z
    .array(
      z.object({
        date: z.number().optional(),
        date_format: z.number().optional(),
        y: z.number().optional(),
        m: z.number().optional(),
      })
    )
    .optional(),
});

export type GameReleaseInfo = z.infer<typeof GameReleaseInfoSchema>;

const pause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

async function fetchChunk(igdbIds: number[]): Promise<GameReleaseInfo[]> {
  const query = `fields ${RELEASE_INFO_FIELDS.join(",")}; where id = (${igdbIds.join(",")}); limit ${CHUNK_SIZE};`;

  let response: unknown;
  try {
    response = await igdbFetch("/games", query);
  } catch (cause) {
    const igdbContext = igdbContextFromThrown(cause);
    logger.error(
      { err: cause, idCount: igdbIds.length, ...igdbContext },
      "IGDB get-games-release-info transport failure"
    );
    throw new UpstreamError("IGDB get-games-release-info failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      idCount: igdbIds.length,
      ...igdbContext,
    });
  }

  const parsed = z.array(GameReleaseInfoSchema).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues },
      "IGDB get-games-release-info returned malformed response"
    );
    throw new UpstreamError(
      "IGDB get-games-release-info returned malformed response"
    );
  }
  return parsed.data;
}

export async function getGamesReleaseInfoByIgdbIds(
  igdbIds: readonly number[]
): Promise<Map<number, GameReleaseInfo>> {
  const releaseInfoByIgdbId = new Map<number, GameReleaseInfo>();

  for (const [index, igdbIdChunk] of chunk(igdbIds, CHUNK_SIZE).entries()) {
    if (index > 0) await pause(PAUSE_BETWEEN_CHUNKS_MS);
    for (const releaseInfo of await fetchChunk(igdbIdChunk)) {
      releaseInfoByIgdbId.set(releaseInfo.id, releaseInfo);
    }
  }

  return releaseInfoByIgdbId;
}
