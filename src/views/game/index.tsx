import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/src/shared/ui/breadcrumb";

import type { GameResponseCombined } from "@/src/entities/game/types";

import { GameInfo } from "@/src/widgets/game-info/game-info";

export function Game({
  breadcrumbName,
  breadcrumbLink,
  gameInfo,
}: {
  gameInfo: GameResponseCombined;
  breadcrumbName: string;
  breadcrumbLink: string;
}) {
  return (
    <div className="container">
      <header className="mb-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-xl" href={`/${breadcrumbLink}`}>
                {breadcrumbName}
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
