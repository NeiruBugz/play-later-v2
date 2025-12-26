import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { z } from "zod";

export const FilterParamsSchema = z.object({
  platform: z.string().optional().default(""),
  status: z.union([z.enum(LibraryItemStatus), z.string()]).optional(),
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
