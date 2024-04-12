import { notFound } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { GameInfo } from "@/app/(protected)/library/components/game/ui/game-info/game-info";
import { getGameWithAdapter } from "@/app/(protected)/library/lib/actions/get-game";

export default async function GamePage({ params }: { params: { id: string } }) {
  const gameInfo = await getGameWithAdapter({ gameId: params.id });

  if (!gameInfo) {
    notFound();
  }

  return (
    <div className="container">
      <header className="mb-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/library" className="text-xl">
                Library
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xl">
                {gameInfo.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <GameInfo game={gameInfo} />
    </div>
  );
}
