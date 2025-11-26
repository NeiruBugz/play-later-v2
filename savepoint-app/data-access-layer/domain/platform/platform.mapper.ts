import type { Platform } from "@prisma/client";

import type { PlatformDTO, PlatformSummaryDTO } from "./platform.dto";
import type { PlatformDomain, PlatformSummaryDomain } from "./platform.model";

/**
 * Mapper class for transforming Platform between different type layers.
 * Handles conversions: Prisma types ↔ Domain models ↔ DTOs
 */
export class PlatformMapper {
  /**
   * Maps a Prisma Platform to a domain model.
   * Pure transformation with no business logic.
   *
   * @param prisma - Platform from Prisma ORM
   * @returns Domain model representation
   */
  static toDomain(prisma: Platform): PlatformDomain {
    return {
      id: prisma.id,
      igdbId: prisma.igdbId,
      name: prisma.name,
      slug: prisma.slug,
      abbreviation: prisma.abbreviation,
      alternativeName: prisma.alternativeName,
      generation: prisma.generation,
      platformFamily: prisma.platformFamily,
      platformType: prisma.platformType,
      checksum: prisma.checksum,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    };
  }

  /**
   * Maps a Prisma Platform to a summary domain model.
   * Used for dropdowns and simple list displays.
   *
   * @param prisma - Platform from Prisma ORM
   * @returns Summary domain model
   */
  static toSummaryDomain(prisma: Platform): PlatformSummaryDomain {
    return {
      id: prisma.id,
      name: prisma.name,
      slug: prisma.slug,
    };
  }

  /**
   * Batch transformation for lists of Prisma platforms.
   *
   * @param prismaItems - Array of Prisma Platforms
   * @returns Array of domain models
   */
  static toDomainList(prismaItems: Platform[]): PlatformDomain[] {
    return prismaItems.map((item) => this.toDomain(item));
  }

  /**
   * Batch transformation for lists of Prisma platforms to summaries.
   *
   * @param prismaItems - Array of Prisma Platforms
   * @returns Array of summary domain models
   */
  static toSummaryDomainList(prismaItems: Platform[]): PlatformSummaryDomain[] {
    return prismaItems.map((item) => this.toSummaryDomain(item));
  }

  /**
   * Maps a domain model to a DTO for API responses.
   * Serializes Date objects to ISO strings for JSON compatibility.
   *
   * @param domain - Domain model
   * @returns DTO with serialized dates
   */
  static toDTO(domain: PlatformDomain): PlatformDTO {
    return {
      id: domain.id,
      igdbId: domain.igdbId,
      name: domain.name,
      slug: domain.slug,
      abbreviation: domain.abbreviation,
      alternativeName: domain.alternativeName,
      generation: domain.generation,
      platformFamily: domain.platformFamily,
      platformType: domain.platformType,
      checksum: domain.checksum,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  /**
   * Maps a summary domain model to a DTO.
   *
   * @param domain - Summary domain model
   * @returns Summary DTO
   */
  static toSummaryDTO(domain: PlatformSummaryDomain): PlatformSummaryDTO {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
    };
  }

  /**
   * Batch transformation for domain models to DTOs.
   *
   * @param domainItems - Array of domain models
   * @returns Array of DTOs
   */
  static toDTOList(domainItems: PlatformDomain[]): PlatformDTO[] {
    return domainItems.map((item) => this.toDTO(item));
  }

  /**
   * Batch transformation for summary domain models to DTOs.
   *
   * @param domainItems - Array of summary domain models
   * @returns Array of summary DTOs
   */
  static toSummaryDTOList(
    domainItems: PlatformSummaryDomain[]
  ): PlatformSummaryDTO[] {
    return domainItems.map((item) => this.toSummaryDTO(item));
  }
}
