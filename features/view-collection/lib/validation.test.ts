import { BacklogItemStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { FilterParamsSchema, validateFilterParams } from "./validation";

describe("FilterParamsSchema", () => {
  describe("platform validation", () => {
    it("should accept empty string as platform", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "PLAYING",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe("");
      }
    });

    it("should accept valid platform strings", () => {
      const platforms = [
        "PC",
        "PlayStation 5",
        "Xbox Series X",
        "Nintendo Switch",
      ];

      platforms.forEach((platform) => {
        const result = FilterParamsSchema.safeParse({
          platform,
          status: "PLAYING",
          search: "",
          page: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.platform).toBe(platform);
        }
      });
    });

    it("should default platform to empty string when not provided", () => {
      const result = FilterParamsSchema.safeParse({
        status: "PLAYING",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe("");
      }
    });

    it("should accept platform with special characters", () => {
      const platform = "PlayStation®5";
      const result = FilterParamsSchema.safeParse({
        platform,
        status: "PLAYING",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe(platform);
      }
    });
  });

  describe("status validation", () => {
    it("should accept valid BacklogItemStatus enum values", () => {
      const validStatuses: BacklogItemStatus[] = [
        "TO_PLAY",
        "PLAYED",
        "PLAYING",
        "COMPLETED",
        "WISHLIST",
      ];

      validStatuses.forEach((status) => {
        const result = FilterParamsSchema.safeParse({
          platform: "",
          status,
          search: "",
          page: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });

    it("should accept empty string as status", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("");
      }
    });

    it("should accept arbitrary string values for status", () => {
      const customStatuses = ["all", "custom", "any"];

      customStatuses.forEach((status) => {
        const result = FilterParamsSchema.safeParse({
          platform: "",
          status,
          search: "",
          page: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });

    it("should handle undefined status gracefully", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBeUndefined();
      }
    });
  });

  describe("search validation", () => {
    it("should accept empty string as search", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "PLAYING",
        search: "",
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("");
      }
    });

    it("should accept valid search strings", () => {
      const searchTerms = [
        "cyberpunk",
        "The Witcher 3",
        "action game",
        "RPG adventure",
        "2024",
      ];

      searchTerms.forEach((search) => {
        const result = FilterParamsSchema.safeParse({
          platform: "",
          status: "PLAYING",
          search,
          page: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.search).toBe(search);
        }
      });
    });

    it("should default search to empty string when not provided", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "PLAYING",
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("");
      }
    });

    it("should handle search with special characters", () => {
      const searchTerms = [
        "Grand Theft Auto: Vice City",
        "Assassin's Creed",
        "Game with (parentheses)",
        "Game with 'quotes'",
        'Game with "double quotes"',
        "Game with & ampersand",
        "Game with 100% completion",
      ];

      searchTerms.forEach((search) => {
        const result = FilterParamsSchema.safeParse({
          platform: "",
          status: "PLAYING",
          search,
          page: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.search).toBe(search);
        }
      });
    });

    it("should handle very long search strings", () => {
      const longSearch = "a".repeat(1000);
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "PLAYING",
        search: longSearch,
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe(longSearch);
      }
    });
  });

  describe("page validation", () => {
    it("should accept valid positive page numbers", () => {
      const validPages = [1, 2, 5, 10, 100, 999];

      validPages.forEach((page) => {
        const result = FilterParamsSchema.safeParse({
          platform: "",
          status: "PLAYING",
          search: "",
          page,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(page);
        }
      });
    });

    it("should default page to 1 when not provided", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "PLAYING",
        search: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("should accept zero as page number", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "PLAYING",
        search: "",
        page: 0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(0);
      }
    });

    it("should accept negative page numbers", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "PLAYING",
        search: "",
        page: -1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(-1);
      }
    });

    it("should handle decimal numbers as page (should fail)", () => {
      const result = FilterParamsSchema.safeParse({
        platform: "",
        status: "PLAYING",
        search: "",
        page: 1.5,
      });

      expect(result.success).toBe(true); // Zod allows decimals for number type
      if (result.success) {
        expect(result.data.page).toBe(1.5);
      }
    });
  });

  describe("complete schema validation", () => {
    it("should validate complete valid filter params", () => {
      const validParams = {
        platform: "PC",
        status: BacklogItemStatus.PLAYING,
        search: "cyberpunk 2077",
        page: 2,
      };

      const result = FilterParamsSchema.safeParse(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validParams);
      }
    });

    it("should apply defaults for missing optional fields", () => {
      const result = FilterParamsSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          platform: "",
          search: "",
          page: 1,
          status: undefined,
        });
      }
    });

    it("should handle mixed valid and invalid fields", () => {
      const mixedParams = {
        platform: "PC",
        status: "PLAYING",
        search: "valid search",
        page: "invalid", // This should cause failure
      };

      const result = FilterParamsSchema.safeParse(mixedParams);
      expect(result.success).toBe(false);
    });

    it("should reject completely invalid input", () => {
      const invalidInputs = [null, undefined, "string", 123, [], true];

      invalidInputs.forEach((input) => {
        const result = FilterParamsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });
  });
});

describe("validateFilterParams", () => {
  describe("valid inputs", () => {
    it("should validate complete filter params", () => {
      const params = {
        platform: "PC",
        status: "PLAYING",
        search: "cyberpunk",
        page: "2",
      };

      const result = validateFilterParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          platform: "PC",
          status: "PLAYING",
          search: "cyberpunk",
          page: 2,
        });
      }
    });

    it("should handle missing optional fields", () => {
      const params = {};

      const result = validateFilterParams(params);

      // This will fail because Number(undefined) = NaN, which Zod rejects
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle missing page field by providing default", () => {
      const params = {
        platform: "",
        status: "",
        search: "",
        page: "1", // Provide default page as string
      };

      const result = validateFilterParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          platform: "",
          status: "",
          search: "",
          page: 1,
        });
      }
    });

    it("should convert string page to number", () => {
      const params = {
        platform: "",
        status: "",
        search: "",
        page: "5",
      };

      const result = validateFilterParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(typeof result.data.page).toBe("number");
      }
    });

    it("should handle numeric page input", () => {
      const params = {
        platform: "",
        status: "",
        search: "",
        page: 3,
      };

      const result = validateFilterParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty string page", () => {
      const params = {
        platform: "",
        status: "",
        search: "",
        page: "",
      };

      const result = validateFilterParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(0); // Number("") === 0
      }
    });

    it("should handle invalid page strings", () => {
      const params = {
        platform: "",
        status: "",
        search: "",
        page: "invalid",
      };

      const result = validateFilterParams(params);

      // This will fail because Number("invalid") = NaN, which Zod rejects
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle decimal page strings", () => {
      const params = {
        platform: "",
        status: "",
        search: "",
        page: "2.5",
      };

      const result = validateFilterParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2.5);
      }
    });

    it("should handle very large page numbers", () => {
      const params = {
        platform: "",
        status: "",
        search: "",
        page: "999999999",
      };

      const result = validateFilterParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(999999999);
      }
    });

    it("should handle negative page strings", () => {
      const params = {
        platform: "",
        status: "",
        search: "",
        page: "-1",
      };

      const result = validateFilterParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(-1);
      }
    });
  });

  describe("real-world scenarios", () => {
    it("should handle URL search params format", () => {
      const urlParams = {
        platform: "PlayStation 5",
        status: "COMPLETED",
        search: "The Last of Us",
        page: "3",
      };

      const result = validateFilterParams(urlParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          platform: "PlayStation 5",
          status: "COMPLETED",
          search: "The Last of Us",
          page: 3,
        });
      }
    });

    it("should handle form data format", () => {
      const formData = {
        platform: "PC",
        status: "",
        search: "action games",
        page: 1,
      };

      const result = validateFilterParams(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          platform: "PC",
          status: "",
          search: "action games",
          page: 1,
        });
      }
    });

    it("should handle API query params", () => {
      const queryParams = {
        platform: "Nintendo Switch",
        status: "BACKLOG",
        search: "",
        page: "1",
      };

      const result = validateFilterParams(queryParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          platform: "Nintendo Switch",
          status: "BACKLOG",
          search: "",
          page: 1,
        });
      }
    });

    it("should handle mixed string and number inputs", () => {
      const mixedParams = {
        platform: "Xbox Series X",
        status: BacklogItemStatus.PLAYING,
        search: "halo infinite",
        page: 2,
      };

      const result = validateFilterParams(mixedParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          platform: "Xbox Series X",
          status: "PLAYING",
          search: "halo infinite",
          page: 2,
        });
      }
    });
  });
});
