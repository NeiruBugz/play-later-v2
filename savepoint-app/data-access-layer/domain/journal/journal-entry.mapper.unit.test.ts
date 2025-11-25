import {
  JournalMood as PrismaJournalMood,
  JournalVisibility as PrismaJournalVisibility,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { JournalMood, JournalVisibility } from "./enums";
import { JournalEntryMapper } from "./journal-entry.mapper";
import type { JournalEntryDomain } from "./journal-entry.model";

describe("JournalEntryMapper", () => {
  describe("toDomain", () => {
    it("should map Prisma JournalEntry to domain model", () => {
      const prismaEntry = {
        id: "entry123",
        userId: "user123",
        gameId: "game456",
        libraryItemId: 1,
        title: "My First Session",
        content: "Had a great time exploring the world!",
        mood: PrismaJournalMood.EXCITED,
        playSession: 1,
        visibility: PrismaJournalVisibility.PRIVATE,
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-01T12:00:00.000Z"),
        publishedAt: null,
      };

      const domain = JournalEntryMapper.toDomain(prismaEntry);

      expect(domain.id).toBe("entry123");
      expect(domain.userId).toBe("user123");
      expect(domain.gameId).toBe("game456");
      expect(domain.libraryItemId).toBe(1);
      expect(domain.title).toBe("My First Session");
      expect(domain.content).toBe("Had a great time exploring the world!");
      expect(domain.mood).toBe(JournalMood.EXCITED);
      expect(domain.playSession).toBe(1);
      expect(domain.visibility).toBe(JournalVisibility.PRIVATE);
      expect(domain.createdAt).toEqual(new Date("2024-01-01T10:00:00.000Z"));
      expect(domain.updatedAt).toEqual(new Date("2024-01-01T12:00:00.000Z"));
      expect(domain.publishedAt).toBeNull();
    });

    it("should handle null values for optional fields", () => {
      const prismaEntry = {
        id: "entry456",
        userId: "user123",
        gameId: "game456",
        libraryItemId: null,
        title: null,
        content: "Just some thoughts",
        mood: null,
        playSession: null,
        visibility: PrismaJournalVisibility.PRIVATE,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        publishedAt: null,
      };

      const domain = JournalEntryMapper.toDomain(prismaEntry);

      expect(domain.libraryItemId).toBeNull();
      expect(domain.title).toBeNull();
      expect(domain.mood).toBeNull();
      expect(domain.playSession).toBeNull();
      expect(domain.publishedAt).toBeNull();
    });

    it("should map all JournalMood values correctly", () => {
      const moods = [
        { prisma: PrismaJournalMood.EXCITED, domain: JournalMood.EXCITED },
        { prisma: PrismaJournalMood.RELAXED, domain: JournalMood.RELAXED },
        { prisma: PrismaJournalMood.FRUSTRATED, domain: JournalMood.FRUSTRATED },
        { prisma: PrismaJournalMood.ACCOMPLISHED, domain: JournalMood.ACCOMPLISHED },
        { prisma: PrismaJournalMood.CURIOUS, domain: JournalMood.CURIOUS },
        { prisma: PrismaJournalMood.NOSTALGIC, domain: JournalMood.NOSTALGIC },
      ];

      for (const { prisma, domain: expectedMood } of moods) {
        const prismaEntry = {
          id: "entry",
          userId: "user",
          gameId: "game",
          libraryItemId: null,
          title: null,
          content: "content",
          mood: prisma,
          playSession: null,
          visibility: PrismaJournalVisibility.PRIVATE,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: null,
        };

        const domainEntry = JournalEntryMapper.toDomain(prismaEntry);
        expect(domainEntry.mood).toBe(expectedMood);
      }
    });

    it("should map all JournalVisibility values correctly", () => {
      const visibilities = [
        { prisma: PrismaJournalVisibility.PRIVATE, domain: JournalVisibility.PRIVATE },
        { prisma: PrismaJournalVisibility.FRIENDS_ONLY, domain: JournalVisibility.FRIENDS_ONLY },
        { prisma: PrismaJournalVisibility.PUBLIC, domain: JournalVisibility.PUBLIC },
      ];

      for (const { prisma, domain: expectedVisibility } of visibilities) {
        const prismaEntry = {
          id: "entry",
          userId: "user",
          gameId: "game",
          libraryItemId: null,
          title: null,
          content: "content",
          mood: null,
          playSession: null,
          visibility: prisma,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: null,
        };

        const domainEntry = JournalEntryMapper.toDomain(prismaEntry);
        expect(domainEntry.visibility).toBe(expectedVisibility);
      }
    });

    it("should handle publishedAt date when present", () => {
      const prismaEntry = {
        id: "entry789",
        userId: "user123",
        gameId: "game456",
        libraryItemId: 1,
        title: "Public Entry",
        content: "Shared with the world!",
        mood: PrismaJournalMood.ACCOMPLISHED,
        playSession: 5,
        visibility: PrismaJournalVisibility.PUBLIC,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        publishedAt: new Date("2024-01-02T15:00:00.000Z"),
      };

      const domain = JournalEntryMapper.toDomain(prismaEntry);

      expect(domain.publishedAt).toEqual(new Date("2024-01-02T15:00:00.000Z"));
    });
  });

  describe("toDomainList", () => {
    it("should transform array of Prisma entries to domain models", () => {
      const prismaEntries = [
        {
          id: "entry1",
          userId: "user123",
          gameId: "game1",
          libraryItemId: 1,
          title: "First Entry",
          content: "Content 1",
          mood: PrismaJournalMood.EXCITED,
          playSession: 1,
          visibility: PrismaJournalVisibility.PRIVATE,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          publishedAt: null,
        },
        {
          id: "entry2",
          userId: "user123",
          gameId: "game1",
          libraryItemId: 1,
          title: "Second Entry",
          content: "Content 2",
          mood: PrismaJournalMood.RELAXED,
          playSession: 2,
          visibility: PrismaJournalVisibility.PRIVATE,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
          publishedAt: null,
        },
      ];

      const domainList = JournalEntryMapper.toDomainList(prismaEntries);

      expect(domainList).toHaveLength(2);
      expect(domainList[0]?.id).toBe("entry1");
      expect(domainList[0]?.title).toBe("First Entry");
      expect(domainList[0]?.mood).toBe(JournalMood.EXCITED);
      expect(domainList[1]?.id).toBe("entry2");
      expect(domainList[1]?.title).toBe("Second Entry");
      expect(domainList[1]?.mood).toBe(JournalMood.RELAXED);
    });

    it("should handle empty array", () => {
      const domainList = JournalEntryMapper.toDomainList([]);
      expect(domainList).toEqual([]);
    });
  });

  describe("toDTO", () => {
    it("should serialize domain model to DTO with ISO date strings", () => {
      const domain: JournalEntryDomain = {
        id: "entry123",
        userId: "user123",
        gameId: "game456",
        libraryItemId: 1,
        title: "My Session",
        content: "Great gameplay!",
        mood: JournalMood.ACCOMPLISHED,
        playSession: 3,
        visibility: JournalVisibility.PRIVATE,
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-01T12:00:00.000Z"),
        publishedAt: null,
      };

      const dto = JournalEntryMapper.toDTO(domain);

      expect(dto.id).toBe("entry123");
      expect(dto.userId).toBe("user123");
      expect(dto.mood).toBe("ACCOMPLISHED");
      expect(dto.visibility).toBe("PRIVATE");
      expect(dto.createdAt).toBe("2024-01-01T10:00:00.000Z");
      expect(dto.updatedAt).toBe("2024-01-01T12:00:00.000Z");
      expect(dto.publishedAt).toBeNull();
    });

    it("should handle null dates", () => {
      const domain: JournalEntryDomain = {
        id: "entry456",
        userId: "user123",
        gameId: "game456",
        libraryItemId: null,
        title: null,
        content: "Just notes",
        mood: null,
        playSession: null,
        visibility: JournalVisibility.PRIVATE,
        createdAt: new Date("2024-01-15T12:00:00.000Z"),
        updatedAt: new Date("2024-01-15T12:00:00.000Z"),
        publishedAt: null,
      };

      const dto = JournalEntryMapper.toDTO(domain);

      expect(dto.libraryItemId).toBeNull();
      expect(dto.title).toBeNull();
      expect(dto.mood).toBeNull();
      expect(dto.playSession).toBeNull();
      expect(dto.publishedAt).toBeNull();
    });

    it("should serialize publishedAt when present", () => {
      const domain: JournalEntryDomain = {
        id: "entry789",
        userId: "user123",
        gameId: "game456",
        libraryItemId: 1,
        title: "Public Entry",
        content: "Shared content",
        mood: JournalMood.EXCITED,
        playSession: 1,
        visibility: JournalVisibility.PUBLIC,
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-02T10:00:00.000Z"),
        publishedAt: new Date("2024-01-02T15:00:00.000Z"),
      };

      const dto = JournalEntryMapper.toDTO(domain);

      expect(dto.publishedAt).toBe("2024-01-02T15:00:00.000Z");
    });
  });

  describe("toDTOList", () => {
    it("should transform array of domain models to DTOs", () => {
      const domainItems: JournalEntryDomain[] = [
        {
          id: "entry1",
          userId: "user123",
          gameId: "game1",
          libraryItemId: 1,
          title: "Entry One",
          content: "Content 1",
          mood: JournalMood.EXCITED,
          playSession: 1,
          visibility: JournalVisibility.PRIVATE,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          publishedAt: null,
        },
        {
          id: "entry2",
          userId: "user123",
          gameId: "game1",
          libraryItemId: 1,
          title: "Entry Two",
          content: "Content 2",
          mood: JournalMood.RELAXED,
          playSession: 2,
          visibility: JournalVisibility.PRIVATE,
          createdAt: new Date("2024-01-02T00:00:00.000Z"),
          updatedAt: new Date("2024-01-02T00:00:00.000Z"),
          publishedAt: null,
        },
      ];

      const dtoList = JournalEntryMapper.toDTOList(domainItems);

      expect(dtoList).toHaveLength(2);
      expect(dtoList[0]?.title).toBe("Entry One");
      expect(dtoList[0]?.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(dtoList[1]?.title).toBe("Entry Two");
      expect(dtoList[1]?.createdAt).toBe("2024-01-02T00:00:00.000Z");
    });

    it("should handle empty array", () => {
      const dtoList = JournalEntryMapper.toDTOList([]);
      expect(dtoList).toEqual([]);
    });
  });

  describe("round-trip transformation", () => {
    it("should maintain data integrity through Prisma → Domain → DTO", () => {
      const originalPrisma = {
        id: "entry123",
        userId: "user123",
        gameId: "game456",
        libraryItemId: 1,
        title: "Test Entry",
        content: "Test content for the journal",
        mood: PrismaJournalMood.ACCOMPLISHED,
        playSession: 5,
        visibility: PrismaJournalVisibility.PUBLIC,
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-02T15:30:00.000Z"),
        publishedAt: new Date("2024-01-02T16:00:00.000Z"),
      };

      const domain = JournalEntryMapper.toDomain(originalPrisma);
      const dto = JournalEntryMapper.toDTO(domain);

      expect(dto.id).toBe(originalPrisma.id);
      expect(dto.userId).toBe(originalPrisma.userId);
      expect(dto.gameId).toBe(originalPrisma.gameId);
      expect(dto.libraryItemId).toBe(originalPrisma.libraryItemId);
      expect(dto.title).toBe(originalPrisma.title);
      expect(dto.content).toBe(originalPrisma.content);
      expect(dto.mood).toBe(originalPrisma.mood);
      expect(dto.playSession).toBe(originalPrisma.playSession);
      expect(dto.visibility).toBe(originalPrisma.visibility);
      expect(dto.createdAt).toBe(originalPrisma.createdAt.toISOString());
      expect(dto.updatedAt).toBe(originalPrisma.updatedAt.toISOString());
      expect(dto.publishedAt).toBe(originalPrisma.publishedAt.toISOString());
    });
  });
});
