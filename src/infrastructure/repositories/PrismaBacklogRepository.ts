import { BacklogItem } from "@/domain/entities/BacklogItem";
import { BacklogRepository } from "@/domain/repositories/BacklogRepository";
import { prisma } from "@/infrastructure/prisma/client";

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
        status: item.status,
        platform: item.platform,
        acquisitionType: item.acquisitionType,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
      },
    });
    return { ...item, updatedAt: updated.updatedAt };
  }
  async findById(id: number): Promise<BacklogItem | null> {
    const found = await prisma.backlogItem.findUnique({ where: { id } });

    return found;
  }
}
