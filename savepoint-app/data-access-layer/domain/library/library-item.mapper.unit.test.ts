import {
  AcquisitionType as PrismaAcquisitionType,
  LibraryItemStatus as PrismaLibraryItemStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { AcquisitionType, LibraryItemStatus } from "./enums";
import { LibraryItemMapper } from "./library-item.mapper";
import type { LibraryItemWithGameDomain } from "./library-item.model";

describe("LibraryItemMapper", () => {
  describe("toDomain", () => {
    it("should map Prisma LibraryItem to domain model", () => {
      const prismaItem = {
        id: 1,
        userId: "user123",
        gameId: "game456",
        status: PrismaLibraryItemStatus.PLAYING,
        platform: "PS5",
        acquisitionType: PrismaAcquisitionType.DIGITAL,
        startedAt: new Date("2024-01-01"),
        completedAt: null,
        createdAt: new Date("2023-12-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const domain = LibraryItemMapper.toDomain(prismaItem);

      expect(domain.id).toBe(1);
      expect(domain.userId).toBe("user123");
      expect(domain.gameId).toBe("game456");
      expect(domain.status).toBe(LibraryItemStatus.PLAYING);
      expect(domain.platform).toBe("PS5");
      expect(domain.acquisitionType).toBe(AcquisitionType.DIGITAL);
      expect(domain.startedAt).toEqual(new Date("2024-01-01"));
      expect(domain.completedAt).toBeNull();
      expect(domain.createdAt).toEqual(new Date("2023-12-01"));
      expect(domain.updatedAt).toEqual(new Date("2024-01-01"));
    });

    it("should handle null values for optional fields", () => {
      const prismaItem = {
        id: 2,
        userId: "user456",
        gameId: "game789",
        status: PrismaLibraryItemStatus.WANT_TO_PLAY,
        platform: null,
        acquisitionType: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      } as any;

      const domain = LibraryItemMapper.toDomain(prismaItem);

      expect(domain.platform).toBeNull();
      expect(domain.acquisitionType).toBeNull();
      expect(domain.startedAt).toBeNull();
      expect(domain.completedAt).toBeNull();
    });
  });

  describe("toWithGameDomain", () => {
    it("should map Prisma LibraryItem with game to domain model", () => {
      const prismaItem = {
        id: 1,
        userId: "user123",
        gameId: "game456",
        status: PrismaLibraryItemStatus.PLAYED,
        platform: "Nintendo Switch",
        acquisitionType: PrismaAcquisitionType.PHYSICAL,
        startedAt: new Date("2024-01-01"),
        completedAt: new Date("2024-02-15"),
        createdAt: new Date("2023-12-01"),
        updatedAt: new Date("2024-02-15"),
        game: {
          id: "game456",
          title: "The Legend of Zelda: Tears of the Kingdom",
          coverImage: "zelda.jpg",
          slug: "zelda-totk",
          releaseDate: new Date("2023-05-12"),
          _count: {
            libraryItems: 3,
          },
        },
      };

      const domain = LibraryItemMapper.toWithGameDomain(prismaItem);

      expect(domain.id).toBe(1);
      expect(domain.game.id).toBe("game456");
      expect(domain.game.title).toBe(
        "The Legend of Zelda: Tears of the Kingdom"
      );
      expect(domain.game.coverImage).toBe("zelda.jpg");
      expect(domain.game.slug).toBe("zelda-totk");
      expect(domain.game.releaseDate).toEqual(new Date("2023-05-12"));
      expect(domain.game.entryCount).toBe(3);
      expect(domain.game).not.toHaveProperty("_count");
    });

    it("should transform _count.libraryItems to entryCount", () => {
      const prismaItem = {
        id: 1,
        userId: "user123",
        gameId: "game456",
        status: PrismaLibraryItemStatus.PLAYING,
        platform: "PC",
        acquisitionType: PrismaAcquisitionType.DIGITAL,
        startedAt: new Date("2024-01-01"),
        completedAt: null,
        createdAt: new Date("2023-12-01"),
        updatedAt: new Date("2024-01-01"),
        game: {
          id: "game456",
          title: "Elden Ring",
          coverImage: "elden.jpg",
          slug: "elden-ring",
          releaseDate: new Date("2022-02-25"),
          _count: {
            libraryItems: 5,
          },
        },
      };

      const domain = LibraryItemMapper.toWithGameDomain(prismaItem);

      expect(domain.game.entryCount).toBe(5);
      expect(domain.game).not.toHaveProperty("_count");
    });

    it("should handle null game coverImage and releaseDate", () => {
      const prismaItem = {
        id: 1,
        userId: "user123",
        gameId: "game456",
        status: PrismaLibraryItemStatus.WANT_TO_PLAY,
        platform: null,
        acquisitionType: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        game: {
          id: "game456",
          title: "Unreleased Game",
          coverImage: null,
          slug: "unreleased",
          releaseDate: null,
          _count: {
            libraryItems: 1,
          },
        },
      } as any;

      const domain = LibraryItemMapper.toWithGameDomain(prismaItem);

      expect(domain.game.coverImage).toBeNull();
      expect(domain.game.releaseDate).toBeNull();
    });
  });

  describe("toWithGameDomainList", () => {
    it("should transform array of Prisma items to domain models", () => {
      const prismaItems = [
        {
          id: 1,
          userId: "user123",
          gameId: "game1",
          status: PrismaLibraryItemStatus.PLAYED,
          platform: "PS5",
          acquisitionType: PrismaAcquisitionType.DIGITAL,
          startedAt: new Date("2024-01-01"),
          completedAt: new Date("2024-02-01"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-02-01"),
          game: {
            id: "game1",
            title: "Game One",
            coverImage: "game1.jpg",
            slug: "game-one",
            releaseDate: new Date("2023-01-01"),
            _count: { libraryItems: 2 },
          },
        },
        {
          id: 2,
          userId: "user123",
          gameId: "game2",
          status: PrismaLibraryItemStatus.PLAYING,
          platform: "PC",
          acquisitionType: PrismaAcquisitionType.PHYSICAL,
          startedAt: new Date("2024-02-01"),
          completedAt: null,
          createdAt: new Date("2024-02-01"),
          updatedAt: new Date("2024-02-01"),
          game: {
            id: "game2",
            title: "Game Two",
            coverImage: "game2.jpg",
            slug: "game-two",
            releaseDate: new Date("2023-06-01"),
            _count: { libraryItems: 1 },
          },
        },
      ];

      const domainList = LibraryItemMapper.toWithGameDomainList(prismaItems);

      expect(domainList).toHaveLength(2);
      expect(domainList[0]?.id).toBe(1);
      expect(domainList[0]?.game.title).toBe("Game One");
      expect(domainList[0]?.game.entryCount).toBe(2);
      expect(domainList[1]?.id).toBe(2);
      expect(domainList[1]?.game.title).toBe("Game Two");
      expect(domainList[1]?.game.entryCount).toBe(1);
    });

    it("should handle empty array", () => {
      const domainList = LibraryItemMapper.toWithGameDomainList([]);
      expect(domainList).toEqual([]);
    });
  });

  describe("toDTO", () => {
    it("should serialize domain model to DTO with ISO date strings", () => {
      const domain = {
        id: 1,
        userId: "user123",
        gameId: "game456",
        status: LibraryItemStatus.PLAYED,
        platform: "PS5",
        acquisitionType: AcquisitionType.DIGITAL,
        startedAt: new Date("2024-01-01T10:00:00.000Z"),
        completedAt: new Date("2024-02-15T15:30:00.000Z"),
        createdAt: new Date("2023-12-01T08:00:00.000Z"),
        updatedAt: new Date("2024-02-15T15:30:00.000Z"),
      };

      const dto = LibraryItemMapper.toDTO(domain);

      expect(dto.id).toBe(1);
      expect(dto.status).toBe("PLAYED");
      expect(dto.acquisitionType).toBe("DIGITAL");
      expect(dto.startedAt).toBe("2024-01-01T10:00:00.000Z");
      expect(dto.completedAt).toBe("2024-02-15T15:30:00.000Z");
      expect(dto.createdAt).toBe("2023-12-01T08:00:00.000Z");
      expect(dto.updatedAt).toBe("2024-02-15T15:30:00.000Z");
    });

    it("should handle null dates", () => {
      const domain = {
        id: 2,
        userId: "user456",
        gameId: "game789",
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: null,
        acquisitionType: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date("2024-01-15T12:00:00.000Z"),
        updatedAt: new Date("2024-01-15T12:00:00.000Z"),
      };

      const dto = LibraryItemMapper.toDTO(domain);

      expect(dto.startedAt).toBeNull();
      expect(dto.completedAt).toBeNull();
      expect(dto.platform).toBeNull();
      expect(dto.acquisitionType).toBeNull();
    });
  });

  describe("toWithGameDTO", () => {
    it("should serialize domain model with game to DTO", () => {
      const domain: LibraryItemWithGameDomain = {
        id: 1,
        userId: "user123",
        gameId: "game456",
        status: LibraryItemStatus.PLAYING,
        platform: "Nintendo Switch",
        acquisitionType: AcquisitionType.PHYSICAL,
        startedAt: new Date("2024-01-01T10:00:00.000Z"),
        completedAt: null,
        createdAt: new Date("2023-12-01T08:00:00.000Z"),
        updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        game: {
          id: "game456",
          title: "The Legend of Zelda",
          coverImage: "zelda.jpg",
          slug: "zelda",
          releaseDate: new Date("2023-05-12T00:00:00.000Z"),
          entryCount: 3,
        },
      };

      const dto = LibraryItemMapper.toWithGameDTO(domain);

      expect(dto.game.title).toBe("The Legend of Zelda");
      expect(dto.game.releaseDate).toBe("2023-05-12T00:00:00.000Z");
      expect(dto.game.entryCount).toBe(3);
      expect(dto.startedAt).toBe("2024-01-01T10:00:00.000Z");
      expect(dto.completedAt).toBeNull();
    });

    it("should handle null game fields", () => {
      const domain: LibraryItemWithGameDomain = {
        id: 1,
        userId: "user123",
        gameId: "game456",
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: null,
        acquisitionType: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        game: {
          id: "game456",
          title: "Upcoming Game",
          coverImage: null,
          slug: "upcoming",
          releaseDate: null,
          entryCount: 1,
        },
      };

      const dto = LibraryItemMapper.toWithGameDTO(domain);

      expect(dto.game.coverImage).toBeNull();
      expect(dto.game.releaseDate).toBeNull();
    });
  });

  describe("toWithGameDTOList", () => {
    it("should transform array of domain models to DTOs", () => {
      const domainItems: LibraryItemWithGameDomain[] = [
        {
          id: 1,
          userId: "user123",
          gameId: "game1",
          status: LibraryItemStatus.PLAYED,
          platform: "PS5",
          acquisitionType: AcquisitionType.DIGITAL,
          startedAt: new Date("2024-01-01T00:00:00.000Z"),
          completedAt: new Date("2024-02-01T00:00:00.000Z"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-02-01T00:00:00.000Z"),
          game: {
            id: "game1",
            title: "Game One",
            coverImage: "game1.jpg",
            slug: "game-one",
            releaseDate: new Date("2023-01-01T00:00:00.000Z"),
            entryCount: 2,
          },
        },
        {
          id: 2,
          userId: "user123",
          gameId: "game2",
          status: LibraryItemStatus.PLAYING,
          platform: "PC",
          acquisitionType: AcquisitionType.PHYSICAL,
          startedAt: new Date("2024-02-01T00:00:00.000Z"),
          completedAt: null,
          createdAt: new Date("2024-02-01T00:00:00.000Z"),
          updatedAt: new Date("2024-02-01T00:00:00.000Z"),
          game: {
            id: "game2",
            title: "Game Two",
            coverImage: "game2.jpg",
            slug: "game-two",
            releaseDate: new Date("2023-06-01T00:00:00.000Z"),
            entryCount: 1,
          },
        },
      ];

      const dtoList = LibraryItemMapper.toWithGameDTOList(domainItems);

      expect(dtoList).toHaveLength(2);
      expect(dtoList[0]?.game.title).toBe("Game One");
      expect(dtoList[0]?.startedAt).toBe("2024-01-01T00:00:00.000Z");
      expect(dtoList[1]?.game.title).toBe("Game Two");
      expect(dtoList[1]?.completedAt).toBeNull();
    });

    it("should handle empty array", () => {
      const dtoList = LibraryItemMapper.toWithGameDTOList([]);
      expect(dtoList).toEqual([]);
    });
  });

  describe("round-trip transformation", () => {
    it("should maintain data integrity through Prisma → Domain → DTO", () => {
      const originalPrisma = {
        id: 1,
        userId: "user123",
        gameId: "game456",
        status: PrismaLibraryItemStatus.PLAYED,
        platform: "PS5",
        acquisitionType: PrismaAcquisitionType.DIGITAL,
        startedAt: new Date("2024-01-01T10:00:00.000Z"),
        completedAt: new Date("2024-02-15T15:30:00.000Z"),
        createdAt: new Date("2023-12-01T08:00:00.000Z"),
        updatedAt: new Date("2024-02-15T15:30:00.000Z"),
        game: {
          id: "game456",
          title: "Test Game",
          coverImage: "test.jpg",
          slug: "test-game",
          releaseDate: new Date("2023-05-12T00:00:00.000Z"),
          _count: {
            libraryItems: 3,
          },
        },
      };

      const domain = LibraryItemMapper.toWithGameDomain(originalPrisma);
      const dto = LibraryItemMapper.toWithGameDTO(domain);

      expect(dto.id).toBe(originalPrisma.id);
      expect(dto.userId).toBe(originalPrisma.userId);
      expect(dto.game.entryCount).toBe(originalPrisma.game._count.libraryItems);
      expect(dto.startedAt).toBe(originalPrisma.startedAt.toISOString());
      expect(dto.game.releaseDate).toBe(
        originalPrisma.game.releaseDate.toISOString()
      );
    });
  });
});
