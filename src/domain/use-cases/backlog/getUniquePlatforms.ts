import { BacklogRepository } from "@/domain/repositories/BacklogRepository";

export class GetUniquePlatformsForUser {
  constructor(private backlogRepo: BacklogRepository) {}

  async execute(userId: string) {
    return this.backlogRepo.getUniqueUserPlatforms(userId);
  }
}
