import { BacklogItem } from "../entities/BacklogItem";

export interface BacklogRepository {
  create(item: BacklogItem): Promise<BacklogItem>;
  update(item: BacklogItem): Promise<BacklogItem>;
  findById(id: number): Promise<BacklogItem | null>;
  getUniqueUserPlatforms(userId: string): Promise<Array<{ platform: string }>>;
}
