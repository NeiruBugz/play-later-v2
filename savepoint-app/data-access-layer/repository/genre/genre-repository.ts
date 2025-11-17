import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import type { Genre as PrismaGenre } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

type IgdbGenre = {
  id: number;
  name?: string;
  slug?: string;
  checksum?: string;
};

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

export async function upsertGenres(
  igdbGenres: IgdbGenre[]
): Promise<RepositoryResult<PrismaGenre[]>> {
  try {
    const genres = await prisma.$transaction(
      igdbGenres.map((g) =>
        prisma.genre.upsert({
          where: { igdbId: g.id },
          update: {
            name: g.name ?? "Unknown Genre",
            slug: g.slug ?? `genre-${g.id}`,
            checksum: g.checksum ?? null,
          },
          create: {
            igdbId: g.id,
            name: g.name ?? "Unknown Genre",
            slug: g.slug ?? `genre-${g.id}`,
            checksum: g.checksum ?? null,
          },
        })
      )
    );
    return repositorySuccess(genres);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to upsert genres: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

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
