import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { GameInfo } from "@/app/(features)/(protected)/library/components/game/ui/game-info/game-info";
import { getGameWithAdapter } from "@/app/(features)/(protected)/library/lib/actions/get-game";

export default async function GamePage({ params }: { params: { id: string } }) {
  const gameInfo = await getGameWithAdapter({
    gameId: params.id,
    isFromWishlist: true,
  });

  if (!gameInfo) {
    notFound();
  }

  return (
    <div className="px-4 md:container">
      <header className="flex items-center gap-2">
        <Link href="/wishlist">
          <Button
            variant="outline"
            className="h-full px-2 py-1 md:px-4 md:py-2"
          >
            <ArrowLeft />
          </Button>
        </Link>
      </header>
      <GameInfo game={gameInfo} />
    </div>
  );
}
