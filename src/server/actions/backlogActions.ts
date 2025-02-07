import { getServerUserId } from "@/domain/auth/auth-service";
import {
  CreateBacklogItem,
  CreateBacklogItemInput,
} from "@/domain/use-cases/backlog/createBacklogItem";
import { GetUniquePlatformsForUser } from "@/domain/use-cases/backlog/getUniquePlatforms";
import { PrismaBacklogRepository } from "@/infrastructure/repositories/PrismaBacklogRepository";
import { redirect } from "next/navigation";

export async function createBacklogItemAction(input: CreateBacklogItemInput) {
  const repo = new PrismaBacklogRepository();
  const useCase = new CreateBacklogItem(repo);
  return await useCase.execute(input);
}

export async function getUniqueUserPlatforms() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/");
  }

  const repo = new PrismaBacklogRepository();
  const useCase = new GetUniquePlatformsForUser(repo);

  return await useCase.execute(userId);
}
