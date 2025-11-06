import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import type { Genre as PrismaGenre } from "@prisma/client";

import { prisma } from "@/shared/lib";

/**
 * IGDB Genre type from their API
 */
type IgdbGenre = {
  id: number;
  name?: string;
  slug?: string;
  checksum?: string;
};

/**
 * Upserts a single genre from IGDB data
 * Creates a new genre if it doesn't exist, updates it if it does
 */
export async function upsertGenre(
  igdbGenre: IgdbGenre
): Promise<RepositoryResult<PrismaGenre>> {
  try {
    const genre = await prisma.genre.upsert({
      where: { igdbId: igdbGenre.id },
      update: {
        name: igdbGenre.name ?? "Unknown Genre",
        slug: igdbGenre.slug ?? `genre-${igdbGenre.id}`,
        checksum: igdbGenre.checksum ?? null,
      },
      create: {
        igdbId: igdbGenre.id,
        name: igdbGenre.name ?? "Unknown Genre",
        slug: igdbGenre.slug ?? `genre-${igdbGenre.id}`,
        checksum: igdbGenre.checksum ?? null,
      },
    });

    return repositorySuccess(genre);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to upsert genre: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Upserts multiple genres from IGDB data
 * Processes each genre individually and returns all successfully upserted genres
 */
export async function upsertGenres(
  igdbGenres: IgdbGenre[]
): Promise<RepositoryResult<PrismaGenre[]>> {
  try {
    const results = await Promise.all(igdbGenres.map((g) => upsertGenre(g)));

    const successfulGenres = results
      .filter((r) => r.ok)
      .map((r) => r.data as PrismaGenre);

    return repositorySuccess(successfulGenres);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to upsert genres: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Finds a genre by its IGDB ID
 * Returns null if not found
 */
export async function findGenreByIgdbId(
  igdbId: number
): Promise<RepositoryResult<PrismaGenre | null>> {
  try {
    const genre = await prisma.genre.findUnique({
      where: { igdbId },
    });

    return repositorySuccess(genre);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find genre: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
