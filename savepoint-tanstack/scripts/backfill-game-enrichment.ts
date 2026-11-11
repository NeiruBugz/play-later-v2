import {
  backfillGameEnrichment,
  countGamesWithCoverTint,
} from "@/entities/game/api/backfill-game-enrichment.server";
import { prisma } from "@/shared/lib/db.server";

try {
  const { totalGames, gamesWithCreditsTime } = await backfillGameEnrichment();
  const gamesWithCoverTint = await countGamesWithCoverTint();
  console.log(
    `${gamesWithCreditsTime} of ${totalGames} games have a credits time, ${gamesWithCoverTint} have a cover tint`
  );
} finally {
  await prisma.$disconnect();
}
