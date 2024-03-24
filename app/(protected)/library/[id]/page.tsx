import { GameInfo } from "@/features/game/ui/game-info";
import { getGame } from "@/features/library/actions";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/back-link";

export default async function GamePage({ params }: { params: { id: string } }) {
  const gameInfo = await getGame(params.id);

  return (
    <div className="container">
      <header className="flex items-center gap-2">
        <BackLink>
          <Button
            variant="outline"
            className="h-full px-2 py-1 md:px-4 md:py-2"
          >
            <ArrowLeft />
          </Button>
        </BackLink>
      </header>
      <GameInfo game={gameInfo} gameStatus={gameInfo.status} />
    </div>
  );
}
