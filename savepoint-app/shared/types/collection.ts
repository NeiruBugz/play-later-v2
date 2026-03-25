import { z } from "zod";

import { LibraryItemStatus } from "./library";

const libraryStatusValues = Object.values(LibraryItemStatus) as [
  string,
  ...string[],
];

export const FilterParamsSchema = z.object({
  platform: z.string().optional().default(""),
  status: z.union([z.enum(libraryStatusValues), z.string()]).optional(),
  search: z.string().optional().default(""),
  page: z.coerce.number().optional().default(1),
});
export type FilterParams = z.infer<typeof FilterParamsSchema>;
export const validateFilterParams = (
  params: Record<string, string | number>
) => {
  return FilterParamsSchema.safeParse({
    platform: params.platform,
    status: params.status,
    search: params.search,
    page: Number(params.page),
  });
};
