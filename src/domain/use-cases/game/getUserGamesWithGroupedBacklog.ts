import { z } from 'zod';
import type {
  GameRepository,
  GameWithBacklogItems,
} from '../../repositories/GameRepository';

const ITEMS_PER_PAGE = 24;

const FilterParamsSchema = z.object({
  platform: z.string().optional().default(''),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
});

export type GetUserGamesWithGroupedBacklogInput = z.infer<
  typeof FilterParamsSchema
>;

export class GetUserGamesWithGroupedBacklog {
  constructor(private gameRepository: GameRepository) {}

  async execute(
    userId: string,
    params: Record<string, string | number>,
  ): Promise<{ collection: GameWithBacklogItems[]; count: number }> {
    const parsedParams = FilterParamsSchema.safeParse({
      platform: params.platform,
      status: params.status,
      search: params.search,
      page: Number(params.page),
    });

    console.log(parsedParams.data);

    if (!parsedParams.success) {
      throw new Error('Invalid filters');
    }

    const { data: filterParams } = parsedParams;

    return await this.gameRepository.getUserGamesWithGroupedBacklog(
      userId,
      filterParams,
      ITEMS_PER_PAGE,
    );
  }
}
