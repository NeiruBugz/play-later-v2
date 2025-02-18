import { BacklogItem } from '@/domain/entities/BacklogItem';
import { BacklogRepository } from '@/domain/repositories/BacklogRepository';
import { prisma } from '@/infrastructure/prisma/client';

export class PrismaBacklogRepository implements BacklogRepository {
  async create(item: BacklogItem): Promise<BacklogItem> {
    const created = await prisma.backlogItem.create({
      data: {
        status: item.status,
        platform: item.platform,
        userId: item.userId,
        acquisitionType: item.acquisitionType,
        gameId: item.gameId,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
      },
    });

    return {
      ...item,
      id: created.id,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }
  async update(item: BacklogItem): Promise<BacklogItem> {
    const updated = await prisma.backlogItem.update({
      where: { id: item.id! },
      data: {
        ...item,
      },
    });
    return { ...item, updatedAt: updated.updatedAt };
  }
  async findById(id: number): Promise<BacklogItem | null> {
    const found = await prisma.backlogItem.findUnique({ where: { id } });

    return found;
  }

  async getUniqueUserPlatforms(userId: string) {
    const result: Array<{ platform: string }> = [];
    const platforms = await prisma.backlogItem.findMany({
      where: {
        userId: userId,
      },
      select: {
        platform: true,
      },
      distinct: ['platform'],
    });

    if (platforms.length === 0) {
      result.push(
        ...[
          { platform: 'pc' },
          { platform: 'playstation' },
          { platform: 'nintendo' },
          { platform: 'xbox' },
          { platform: 'all' },
        ],
      );
    }

    platforms.forEach((platform) => {
      if (typeof platform.platform === 'string') {
        result.push({ platform: platform.platform });
      }
    });

    return result;
  }
}
