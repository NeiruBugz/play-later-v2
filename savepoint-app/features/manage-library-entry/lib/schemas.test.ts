import { LibraryItemStatus } from "@/shared/types";

import {
  AddToLibrarySchema,
  UpdateLibraryEntrySchema,
  UpdateLibraryStatusByIgdbSchema,
  UpdateLibraryStatusSchema,
} from "../schemas";

describe("AddToLibrarySchema", () => {
  describe("given valid input with all fields", () => {
    it("should successfully validate complete data including platform", () => {
      const validInput = {
        igdbId: 12345,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PlayStation 5",
        startedAt: new Date("2025-01-15"),
        completedAt: new Date("2025-01-20"),
      };

      const result = AddToLibrarySchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });
  });

  describe("given input without optional platform field", () => {
    it("should successfully validate when platform is undefined", () => {
      const inputWithoutPlatform = {
        igdbId: 12345,
        status: LibraryItemStatus.PLAYING,
      };

      const result = AddToLibrarySchema.safeParse(inputWithoutPlatform);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBeUndefined();
      }
    });

    it("should successfully validate when platform is explicitly undefined", () => {
      const inputWithExplicitUndefined = {
        igdbId: 12345,
        status: LibraryItemStatus.OWNED,
        platform: undefined,
      };

      const result = AddToLibrarySchema.safeParse(inputWithExplicitUndefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBeUndefined();
      }
    });

    it("should successfully validate minimal input with only required fields", () => {
      const minimalInput = {
        igdbId: 98765,
        status: LibraryItemStatus.PLAYED,
      };

      const result = AddToLibrarySchema.safeParse(minimalInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.igdbId).toBe(98765);
        expect(result.data.status).toBe(LibraryItemStatus.PLAYED);
        expect(result.data.platform).toBeUndefined();
        expect(result.data.startedAt).toBeUndefined();
        expect(result.data.completedAt).toBeUndefined();
      }
    });
  });

  describe("given input with valid platform string", () => {
    it("should accept platform when provided", () => {
      const inputWithPlatform = {
        igdbId: 11111,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PC",
      };

      const result = AddToLibrarySchema.safeParse(inputWithPlatform);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe("PC");
      }
    });

    it("should accept various platform names", () => {
      const platforms = [
        "PlayStation 5",
        "Xbox Series X",
        "Nintendo Switch",
        "PC",
        "Steam Deck",
      ];

      platforms.forEach((platform) => {
        const input = {
          igdbId: 12345,
          status: LibraryItemStatus.PLAYING,
          platform,
        };

        const result = AddToLibrarySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.platform).toBe(platform);
        }
      });
    });
  });

  describe("given invalid input", () => {
    it("should reject when igdbId is missing", () => {
      const invalidInput = {
        status: LibraryItemStatus.WANT_TO_PLAY,
      };

      const result = AddToLibrarySchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject when igdbId is not a positive integer", () => {
      const invalidInputs = [
        { igdbId: -1, status: LibraryItemStatus.PLAYING },
        { igdbId: 0, status: LibraryItemStatus.PLAYING },
        { igdbId: 3.14, status: LibraryItemStatus.PLAYING },
      ];

      invalidInputs.forEach((input) => {
        const result = AddToLibrarySchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    it("should reject when status is invalid", () => {
      const invalidInput = {
        igdbId: 12345,
        status: "INVALID_STATUS",
      };

      const result = AddToLibrarySchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject when status is missing", () => {
      const invalidInput = {
        igdbId: 12345,
      };

      const result = AddToLibrarySchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe("given input with optional date fields", () => {
    it("should accept valid startedAt date", () => {
      const input = {
        igdbId: 12345,
        status: LibraryItemStatus.PLAYING,
        startedAt: new Date("2025-01-01"),
      };

      const result = AddToLibrarySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startedAt).toEqual(new Date("2025-01-01"));
      }
    });

    it("should accept valid completedAt date", () => {
      const input = {
        igdbId: 12345,
        status: LibraryItemStatus.PLAYED,
        completedAt: new Date("2025-01-15"),
      };

      const result = AddToLibrarySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completedAt).toEqual(new Date("2025-01-15"));
      }
    });

    it("should accept both startedAt and completedAt dates", () => {
      const input = {
        igdbId: 12345,
        status: LibraryItemStatus.PLAYED,
        startedAt: new Date("2025-01-01"),
        completedAt: new Date("2025-01-15"),
      };

      const result = AddToLibrarySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startedAt).toEqual(new Date("2025-01-01"));
        expect(result.data.completedAt).toEqual(new Date("2025-01-15"));
      }
    });
  });
});

describe("UpdateLibraryStatusSchema", () => {
  it("should validate correct input", () => {
    const validInput = {
      gameId: "clx123abc456def",
      status: LibraryItemStatus.PLAYING,
    };

    const result = UpdateLibraryStatusSchema.safeParse(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it("should reject invalid gameId format", () => {
    const invalidInput = {
      gameId: "invalid-id",
      status: LibraryItemStatus.PLAYING,
    };

    const result = UpdateLibraryStatusSchema.safeParse(invalidInput);

    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const invalidInput = {
      gameId: "clx123abc456def",
      status: "INVALID",
    };

    const result = UpdateLibraryStatusSchema.safeParse(invalidInput);

    expect(result.success).toBe(false);
  });
});

describe("UpdateLibraryEntrySchema", () => {
  it("should validate input with all fields", () => {
    const validInput = {
      libraryItemId: 123,
      status: LibraryItemStatus.PLAYED,
      startedAt: new Date("2025-01-01"),
      completedAt: new Date("2025-01-15"),
    };

    const result = UpdateLibraryEntrySchema.safeParse(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it("should validate input with only required fields", () => {
    const minimalInput = {
      libraryItemId: 456,
      status: LibraryItemStatus.PLAYING,
    };

    const result = UpdateLibraryEntrySchema.safeParse(minimalInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.libraryItemId).toBe(456);
      expect(result.data.status).toBe(LibraryItemStatus.PLAYING);
      expect(result.data.startedAt).toBeUndefined();
      expect(result.data.completedAt).toBeUndefined();
    }
  });

  it("should reject when libraryItemId is not a positive integer", () => {
    const invalidInputs = [
      { libraryItemId: -1, status: LibraryItemStatus.PLAYING },
      { libraryItemId: 0, status: LibraryItemStatus.PLAYING },
      { libraryItemId: 3.14, status: LibraryItemStatus.PLAYING },
    ];

    invalidInputs.forEach((input) => {
      const result = UpdateLibraryEntrySchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

describe("UpdateLibraryStatusByIgdbSchema", () => {
  it("should validate correct input", () => {
    const validInput = {
      igdbId: 54321,
      status: LibraryItemStatus.WANT_TO_PLAY,
    };

    const result = UpdateLibraryStatusByIgdbSchema.safeParse(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it("should reject invalid igdbId", () => {
    const invalidInputs = [
      { igdbId: -1, status: LibraryItemStatus.PLAYING },
      { igdbId: 0, status: LibraryItemStatus.PLAYING },
      { igdbId: 1.5, status: LibraryItemStatus.PLAYING },
    ];

    invalidInputs.forEach((input) => {
      const result = UpdateLibraryStatusByIgdbSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  it("should reject invalid status", () => {
    const invalidInput = {
      igdbId: 12345,
      status: "NOT_A_VALID_STATUS",
    };

    const result = UpdateLibraryStatusByIgdbSchema.safeParse(invalidInput);

    expect(result.success).toBe(false);
  });
});
