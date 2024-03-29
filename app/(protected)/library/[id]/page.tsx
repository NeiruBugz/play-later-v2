import { GameInfo } from "@/features/game/ui/game-info/game-info";
import { getGame } from "@/features/library/actions";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default async function GamePage({ params }: { params: { id: string } }) {
  const gameInfo = await getGame(params.id);

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
