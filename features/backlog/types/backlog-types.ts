import { z } from 'zod';

export const FilterParamsSchema = z.object({
  platform: z.string().optional().default(''),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
  sort: z.string().optional().default('dateAdded_desc'),
});

export type GetUserGamesWithGroupedBacklogInput = z.infer<
  typeof FilterParamsSchema
>;

export type BacklogItemData = {
  status: string;
  acquisitionType: string;
  platform: string;
};
