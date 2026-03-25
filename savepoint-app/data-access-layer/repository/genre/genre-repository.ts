import "server-only";

import type { Genre as PrismaGenre } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

type IgdbGenre = {
  id: number;
  name?: string;
  slug?: string;
  checksum?: string;
};

export async function upsertGenre(igdbGenre: IgdbGenre): Promise<PrismaGenre> {
  return prisma.genre.upsert({
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
}

export async function upsertGenres(
  igdbGenres: IgdbGenre[]
): Promise<PrismaGenre[]> {
  return prisma.$transaction(
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
}

export async function findGenreByIgdbId(
  igdbId: number
): Promise<PrismaGenre | null> {
  return prisma.genre.findUnique({
    where: { igdbId },
  });
}
