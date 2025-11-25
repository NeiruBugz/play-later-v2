import type { JournalEntry } from "@prisma/client";
import {
  JournalMood as PrismaJournalMood,
  JournalVisibility as PrismaJournalVisibility,
} from "@prisma/client";

import type { JournalEntryDomain } from "./journal-entry.model";
import type { JournalEntryDTO } from "./journal-entry.dto";
import { JournalMood, JournalVisibility } from "./enums";

/**
 * Maps Prisma JournalMood enum to domain JournalMood enum.
 * Since the enum values are identical strings, this is a type-safe cast.
 */
function mapJournalMoodToDomain(mood: PrismaJournalMood | null): JournalMood | null {
  return mood === null ? null : (mood as unknown as JournalMood);
}

/**
 * Maps Prisma JournalVisibility enum to domain JournalVisibility enum.
 * Since the enum values are identical strings, this is a type-safe cast.
 */
function mapJournalVisibilityToDomain(
  visibility: PrismaJournalVisibility
): JournalVisibility {
  return visibility as unknown as JournalVisibility;
}

/**
 * Mapper class for transforming JournalEntry between different type layers.
 * Handles conversions: Prisma types ↔ Domain models ↔ DTOs
 */
export class JournalEntryMapper {
  /**
   * Maps a Prisma JournalEntry to a domain model.
   * Pure transformation with no business logic.
   * Converts Prisma enums to domain enums.
   *
   * @param prisma - JournalEntry from Prisma ORM
   * @returns Domain model representation
   */
  static toDomain(prisma: JournalEntry): JournalEntryDomain {
    return {
      id: prisma.id,
      userId: prisma.userId,
      gameId: prisma.gameId,
      libraryItemId: prisma.libraryItemId,
      title: prisma.title,
      content: prisma.content,
      mood: mapJournalMoodToDomain(prisma.mood),
      playSession: prisma.playSession,
      visibility: mapJournalVisibilityToDomain(prisma.visibility),
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      publishedAt: prisma.publishedAt,
    };
  }

  /**
   * Batch transformation for lists of Prisma journal entries.
   *
   * @param prismaItems - Array of Prisma JournalEntries
   * @returns Array of domain models
   */
  static toDomainList(prismaItems: JournalEntry[]): JournalEntryDomain[] {
    return prismaItems.map((item) => this.toDomain(item));
  }

  /**
   * Maps a domain model to a DTO for API responses.
   * Serializes Date objects to ISO strings for JSON compatibility.
   *
   * @param domain - Domain model
   * @returns DTO with serialized dates
   */
  static toDTO(domain: JournalEntryDomain): JournalEntryDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      gameId: domain.gameId,
      libraryItemId: domain.libraryItemId,
      title: domain.title,
      content: domain.content,
      mood: domain.mood,
      playSession: domain.playSession,
      visibility: domain.visibility,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      publishedAt: domain.publishedAt?.toISOString() ?? null,
    };
  }

  /**
   * Batch transformation for domain models to DTOs.
   *
   * @param domainItems - Array of domain models
   * @returns Array of DTOs
   */
  static toDTOList(domainItems: JournalEntryDomain[]): JournalEntryDTO[] {
    return domainItems.map((item) => this.toDTO(item));
  }
}
