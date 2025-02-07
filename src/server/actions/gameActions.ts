import { getServerUserId } from "@/domain/auth/auth-service";
import { GetUserGamesWithGroupedBacklog } from "@/domain/use-cases/game/getUserGamesWithGroupedBacklog";
import { PrismaGameRepository } from "@/infrastructure/repositories/PrismaGameRepository";
import { redirect } from "next/navigation";

export async function getUserGamesWithGroupedBacklogAction(
  params: Record<string, string | number>,
) {
  const userId = await getServerUserId();
  if (!userId) {
    console.error("Unable to find authenticated user");
    redirect("/");
  }

  const repository = new PrismaGameRepository();
  const useCase = new GetUserGamesWithGroupedBacklog(repository);

  return await useCase.execute(userId, params);
}
