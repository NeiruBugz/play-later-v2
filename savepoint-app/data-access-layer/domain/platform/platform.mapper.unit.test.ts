import { describe, expect, it } from "vitest";

import { PlatformMapper } from "./platform.mapper";
import type { PlatformDomain, PlatformSummaryDomain } from "./platform.model";

describe("PlatformMapper", () => {
  describe("toDomain", () => {
    it("should map Prisma Platform to domain model", () => {
      const prismaPlatform = {
        id: "platform123",
        igdbId: 48,
        name: "PlayStation 5",
        slug: "playstation-5",
        abbreviation: "PS5",
        alternativeName: "PS5",
        generation: 9,
        platformFamily: 1,
        platformType: 1,
        checksum: "abc123",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-01T12:00:00.000Z"),
      };

      const domain = PlatformMapper.toDomain(prismaPlatform);

      expect(domain.id).toBe("platform123");
      expect(domain.igdbId).toBe(48);
      expect(domain.name).toBe("PlayStation 5");
      expect(domain.slug).toBe("playstation-5");
      expect(domain.abbreviation).toBe("PS5");
      expect(domain.alternativeName).toBe("PS5");
      expect(domain.generation).toBe(9);
      expect(domain.platformFamily).toBe(1);
      expect(domain.platformType).toBe(1);
      expect(domain.checksum).toBe("abc123");
      expect(domain.createdAt).toEqual(new Date("2024-01-01T10:00:00.000Z"));
      expect(domain.updatedAt).toEqual(new Date("2024-01-01T12:00:00.000Z"));
    });

    it("should handle null values for optional fields", () => {
      const prismaPlatform = {
        id: "platform456",
        igdbId: 6,
        name: "PC",
        slug: "pc",
        abbreviation: null,
        alternativeName: null,
        generation: null,
        platformFamily: null,
        platformType: null,
        checksum: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      };

      const domain = PlatformMapper.toDomain(prismaPlatform);

      expect(domain.abbreviation).toBeNull();
      expect(domain.alternativeName).toBeNull();
      expect(domain.generation).toBeNull();
      expect(domain.platformFamily).toBeNull();
      expect(domain.platformType).toBeNull();
      expect(domain.checksum).toBeNull();
    });
  });

  describe("toSummaryDomain", () => {
    it("should map Prisma Platform to summary domain model", () => {
      const prismaPlatform = {
        id: "platform123",
        igdbId: 48,
        name: "PlayStation 5",
        slug: "playstation-5",
        abbreviation: "PS5",
        alternativeName: "PS5",
        generation: 9,
        platformFamily: 1,
        platformType: 1,
        checksum: "abc123",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const summary = PlatformMapper.toSummaryDomain(prismaPlatform);

      expect(summary.id).toBe("platform123");
      expect(summary.name).toBe("PlayStation 5");
      expect(summary.slug).toBe("playstation-5");
      expect(Object.keys(summary)).toHaveLength(3);
    });
  });

  describe("toDomainList", () => {
    it("should transform array of Prisma platforms to domain models", () => {
      const prismaPlatforms = [
        {
          id: "platform1",
          igdbId: 48,
          name: "PlayStation 5",
          slug: "playstation-5",
          abbreviation: "PS5",
          alternativeName: null,
          generation: 9,
          platformFamily: 1,
          platformType: 1,
          checksum: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "platform2",
          igdbId: 130,
          name: "Nintendo Switch",
          slug: "nintendo-switch",
          abbreviation: "Switch",
          alternativeName: null,
          generation: 8,
          platformFamily: 5,
          platformType: 1,
          checksum: null,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      ];

      const domainList = PlatformMapper.toDomainList(prismaPlatforms);

      expect(domainList).toHaveLength(2);
      expect(domainList[0]?.name).toBe("PlayStation 5");
      expect(domainList[1]?.name).toBe("Nintendo Switch");
    });

    it("should handle empty array", () => {
      const domainList = PlatformMapper.toDomainList([]);
      expect(domainList).toEqual([]);
    });
  });

  describe("toSummaryDomainList", () => {
    it("should transform array of Prisma platforms to summary domain models", () => {
      const prismaPlatforms = [
        {
          id: "platform1",
          igdbId: 48,
          name: "PlayStation 5",
          slug: "playstation-5",
          abbreviation: "PS5",
          alternativeName: null,
          generation: 9,
          platformFamily: 1,
          platformType: 1,
          checksum: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "platform2",
          igdbId: 6,
          name: "PC",
          slug: "pc",
          abbreviation: null,
          alternativeName: null,
          generation: null,
          platformFamily: null,
          platformType: null,
          checksum: null,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      ];

      const summaryList = PlatformMapper.toSummaryDomainList(prismaPlatforms);

      expect(summaryList).toHaveLength(2);
      expect(summaryList[0]).toEqual({
        id: "platform1",
        name: "PlayStation 5",
        slug: "playstation-5",
      });
      expect(summaryList[1]).toEqual({
        id: "platform2",
        name: "PC",
        slug: "pc",
      });
    });
  });

  describe("toDTO", () => {
    it("should serialize domain model to DTO with ISO date strings", () => {
      const domain: PlatformDomain = {
        id: "platform123",
        igdbId: 48,
        name: "PlayStation 5",
        slug: "playstation-5",
        abbreviation: "PS5",
        alternativeName: "PS5",
        generation: 9,
        platformFamily: 1,
        platformType: 1,
        checksum: "abc123",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-01T12:00:00.000Z"),
      };

      const dto = PlatformMapper.toDTO(domain);

      expect(dto.id).toBe("platform123");
      expect(dto.igdbId).toBe(48);
      expect(dto.name).toBe("PlayStation 5");
      expect(dto.createdAt).toBe("2024-01-01T10:00:00.000Z");
      expect(dto.updatedAt).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should handle null values", () => {
      const domain: PlatformDomain = {
        id: "platform456",
        igdbId: 6,
        name: "PC",
        slug: "pc",
        abbreviation: null,
        alternativeName: null,
        generation: null,
        platformFamily: null,
        platformType: null,
        checksum: null,
        createdAt: new Date("2024-01-15T12:00:00.000Z"),
        updatedAt: new Date("2024-01-15T12:00:00.000Z"),
      };

      const dto = PlatformMapper.toDTO(domain);

      expect(dto.abbreviation).toBeNull();
      expect(dto.alternativeName).toBeNull();
      expect(dto.generation).toBeNull();
    });
  });

  describe("toSummaryDTO", () => {
    it("should map summary domain to summary DTO", () => {
      const summary: PlatformSummaryDomain = {
        id: "platform123",
        name: "PlayStation 5",
        slug: "playstation-5",
      };

      const dto = PlatformMapper.toSummaryDTO(summary);

      expect(dto.id).toBe("platform123");
      expect(dto.name).toBe("PlayStation 5");
      expect(dto.slug).toBe("playstation-5");
    });
  });

  describe("toDTOList", () => {
    it("should transform array of domain models to DTOs", () => {
      const domainItems: PlatformDomain[] = [
        {
          id: "platform1",
          igdbId: 48,
          name: "PlayStation 5",
          slug: "playstation-5",
          abbreviation: "PS5",
          alternativeName: null,
          generation: 9,
          platformFamily: 1,
          platformType: 1,
          checksum: null,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: "platform2",
          igdbId: 6,
          name: "PC",
          slug: "pc",
          abbreviation: null,
          alternativeName: null,
          generation: null,
          platformFamily: null,
          platformType: null,
          checksum: null,
          createdAt: new Date("2024-01-02T00:00:00.000Z"),
          updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        },
      ];

      const dtoList = PlatformMapper.toDTOList(domainItems);

      expect(dtoList).toHaveLength(2);
      expect(dtoList[0]?.name).toBe("PlayStation 5");
      expect(dtoList[0]?.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(dtoList[1]?.name).toBe("PC");
    });

    it("should handle empty array", () => {
      const dtoList = PlatformMapper.toDTOList([]);
      expect(dtoList).toEqual([]);
    });
  });

  describe("round-trip transformation", () => {
    it("should maintain data integrity through Prisma → Domain → DTO", () => {
      const originalPrisma = {
        id: "platform123",
        igdbId: 48,
        name: "PlayStation 5",
        slug: "playstation-5",
        abbreviation: "PS5",
        alternativeName: "PS5",
        generation: 9,
        platformFamily: 1,
        platformType: 1,
        checksum: "abc123",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-01T12:00:00.000Z"),
      };

      const domain = PlatformMapper.toDomain(originalPrisma);
      const dto = PlatformMapper.toDTO(domain);

      expect(dto.id).toBe(originalPrisma.id);
      expect(dto.igdbId).toBe(originalPrisma.igdbId);
      expect(dto.name).toBe(originalPrisma.name);
      expect(dto.slug).toBe(originalPrisma.slug);
      expect(dto.abbreviation).toBe(originalPrisma.abbreviation);
      expect(dto.createdAt).toBe(originalPrisma.createdAt.toISOString());
      expect(dto.updatedAt).toBe(originalPrisma.updatedAt.toISOString());
    });
  });
});
