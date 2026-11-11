import { backfillGameEnrichment } from "@/entities/game/api/backfill-game-enrichment.server";
import { prisma } from "@/shared/lib/db.server";

try {
  const { totalGames, gamesWithCreditsTime } = await backfillGameEnrichment();
  console.log(
    `${gamesWithCreditsTime} of ${totalGames} games have a credits time`
  );
} finally {
  await prisma.$disconnect();
}
