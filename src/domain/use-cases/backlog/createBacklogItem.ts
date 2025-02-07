import { BacklogItem } from "@/domain/entities/BacklogItem";
import { BacklogRepository } from "@/domain/repositories/BacklogRepository";

export interface CreateBacklogItemInput {
  userId: string;
  gameId: string;
  platform?: string;
  acquisitionType: "PHYSICAL" | "DIGITAL" | "SUBSCRIPTION";
  status: "TO_PLAY" | "PLAYED" | "PLAYING" | "COMPLETED" | "WISHLIST";
}

export class CreateBacklogItem {
  constructor(private backlogRepository: BacklogRepository) {}

  async execute(input: CreateBacklogItemInput): Promise<BacklogItem> {
    const backlogItem: BacklogItem = {
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.backlogRepository.create(backlogItem);
  }
}
