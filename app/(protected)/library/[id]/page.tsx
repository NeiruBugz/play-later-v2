import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Game } from "@/src/views/game";

import { getGameWithAdapter } from "@/src/entities/game/api/get-game";

export default async function GamePage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const gameInfo = await getGameWithAdapter({ gameId: params.id });

  if (!gameInfo) {
    notFound();
  }

  return (
    <Game
      gameInfo={gameInfo}
      breadcrumbLink="library"
      breadcrumbName="Library"
    />
  );
}
