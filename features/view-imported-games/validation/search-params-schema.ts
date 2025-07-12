import { Storefront } from "@prisma/client";
import { z } from "zod";

const DEFAULT_PAGINATION_PARAMETERS = {
  PAGE: { min: 1, default: 1 },
  LIMIT: { min: 1, max: 100, default: 20 },
  SORT_BY: { default: "name" },
  SORT_ORDER: { default: "asc" },
};

export const SearchParamsSchema = z.object({
  page: z.coerce
    .number()
    .min(DEFAULT_PAGINATION_PARAMETERS.PAGE.min)
    .default(DEFAULT_PAGINATION_PARAMETERS.PAGE.default),
  limit: z.coerce
    .number()
    .min(DEFAULT_PAGINATION_PARAMETERS.LIMIT.min)
    .max(DEFAULT_PAGINATION_PARAMETERS.LIMIT.max)
    .default(DEFAULT_PAGINATION_PARAMETERS.LIMIT.default),
  search: z.string().optional(),
  storefront: z.nativeEnum(Storefront).optional(),
  sortBy: z
    .enum(["name", "playtime", "storefront", "createdAt"])
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
