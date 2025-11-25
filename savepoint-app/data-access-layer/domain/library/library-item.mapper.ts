import type { LibraryItem } from "@prisma/client";
import {
  AcquisitionType as PrismaAcquisitionType,
  LibraryItemStatus as PrismaLibraryItemStatus,
} from "@prisma/client";

import type {
  LibraryItemDomain,
  LibraryItemWithGameDomain,
} from "./library-item.model";
import type {
  LibraryItemDTO,
  LibraryItemWithGameDTO,
} from "./library-item.dto";
import { AcquisitionType, LibraryItemStatus } from "./enums";

/**
 * Prisma type for library item with game relation and count.
 * Matches the structure returned by findLibraryItemsWithFilters repository function.
 */
type PrismaLibraryItemWithGame = LibraryItem & {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
    releaseDate: Date | null;
    _count: {
      libraryItems: number;
    };
  };
};

/**
 * Maps Prisma LibraryItemStatus enum to domain LibraryItemStatus enum.
 * Since the enum values are identical strings, this is a type-safe cast.
 */
function mapLibraryItemStatusToDomain(
  status: PrismaLibraryItemStatus
): LibraryItemStatus {
  return status as unknown as LibraryItemStatus;
}

/**
 * Maps Prisma AcquisitionType enum to domain AcquisitionType enum.
 * Since the enum values are identical strings, this is a type-safe cast.
 */
function mapAcquisitionTypeToDomain(
  type: PrismaAcquisitionType | null
): AcquisitionType | null {
  return type === null ? null : (type as unknown as AcquisitionType);
}

/**
 * Maps domain LibraryItemStatus enum to Prisma LibraryItemStatus enum.
 * Since the enum values are identical strings, this is a type-safe cast.
 * Used at service-repository boundary.
 */
export function mapLibraryItemStatusToPrisma(
  status: LibraryItemStatus
): PrismaLibraryItemStatus {
  return status as unknown as PrismaLibraryItemStatus;
}

/**
 * Maps domain AcquisitionType enum to Prisma AcquisitionType enum.
 * Since the enum values are identical strings, this is a type-safe cast.
 * Used at service-repository boundary.
 */
export function mapAcquisitionTypeToPrisma(
  type: AcquisitionType
): PrismaAcquisitionType {
  return type as unknown as PrismaAcquisitionType;
}

/**
 * Mapper class for transforming LibraryItem between different type layers.
 * Handles conversions: Prisma types ↔ Domain models ↔ DTOs
 */
export class LibraryItemMapper {
  /**
   * Maps a Prisma LibraryItem to a domain model.
   * Pure transformation with no business logic.
   * Converts Prisma enums to domain enums.
   *
   * @param prisma - LibraryItem from Prisma ORM
   * @returns Domain model representation
   */
  static toDomain(prisma: LibraryItem): LibraryItemDomain {
    return {
      id: prisma.id,
      userId: prisma.userId,
      gameId: prisma.gameId,
      status: mapLibraryItemStatusToDomain(prisma.status),
      platform: prisma.platform,
      acquisitionType: mapAcquisitionTypeToDomain(prisma.acquisitionType),
      startedAt: prisma.startedAt,
      completedAt: prisma.completedAt,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    };
  }

  /**
   * Maps a Prisma LibraryItem with game relation to domain model.
   * Transforms Prisma's `_count.libraryItems` to semantic `entryCount` field.
   *
   * @param prisma - LibraryItem with game relation from Prisma
   * @returns Domain model with transformed game data
   */
  static toWithGameDomain(
    prisma: PrismaLibraryItemWithGame
  ): LibraryItemWithGameDomain {
    return {
      ...this.toDomain(prisma),
      game: {
        id: prisma.game.id,
        title: prisma.game.title,
        coverImage: prisma.game.coverImage,
        slug: prisma.game.slug,
        releaseDate: prisma.game.releaseDate,
        entryCount: prisma.game._count.libraryItems,
      },
    };
  }

  /**
   * Batch transformation for lists of Prisma library items with games.
   *
   * @param prismaItems - Array of Prisma LibraryItems with game relations
   * @returns Array of domain models
   */
  static toWithGameDomainList(
    prismaItems: PrismaLibraryItemWithGame[]
  ): LibraryItemWithGameDomain[] {
    return prismaItems.map((item) => this.toWithGameDomain(item));
  }

  /**
   * Maps a domain model to a DTO for API responses.
   * Serializes Date objects to ISO strings for JSON compatibility.
   *
   * @param domain - Domain model
   * @returns DTO with serialized dates
   */
  static toDTO(domain: LibraryItemDomain): LibraryItemDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      gameId: domain.gameId,
      status: domain.status,
      platform: domain.platform,
      acquisitionType: domain.acquisitionType,
      startedAt: domain.startedAt?.toISOString() ?? null,
      completedAt: domain.completedAt?.toISOString() ?? null,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  /**
   * Maps a domain model with game to a DTO with game information.
   *
   * @param domain - Domain model with game
   * @returns DTO with serialized dates and game data
   */
  static toWithGameDTO(
    domain: LibraryItemWithGameDomain
  ): LibraryItemWithGameDTO {
    return {
      ...this.toDTO(domain),
      game: {
        id: domain.game.id,
        title: domain.game.title,
        coverImage: domain.game.coverImage,
        slug: domain.game.slug,
        releaseDate: domain.game.releaseDate?.toISOString() ?? null,
        entryCount: domain.game.entryCount,
      },
    };
  }

  /**
   * Batch transformation for domain models to DTOs.
   *
   * @param domainItems - Array of domain models with game data
   * @returns Array of DTOs
   */
  static toWithGameDTOList(
    domainItems: LibraryItemWithGameDomain[]
  ): LibraryItemWithGameDTO[] {
    return domainItems.map((item) => this.toWithGameDTO(item));
  }
}
