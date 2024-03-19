import { GameCard } from "@/features/game/ui/game-card"
import { ListWrapper } from "@/features/library/ui/list-wrapper"

import { LibraryContentProps } from "@/types/library"

export function LibraryContent({
  currentStatus,
  totalBacklogTime,
  backloggedLength,
  list,
}: LibraryContentProps) {
  if (Array.isArray(list)) {
    return (
      <div>
        {currentStatus === "BACKLOG" ? (
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold">
              Total backlog time is {totalBacklogTime} hours and includes{" "}
              {backloggedLength} game(s)
            </p>
          </div>
        ) : null}
        <ListWrapper count={backloggedLength}>
          {list.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </ListWrapper>
      </div>
    )
  }

  return (
    <div>
      {currentStatus === "BACKLOG" ? (
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold">
            Total backlog time is {totalBacklogTime} hours and includes{" "}
            {backloggedLength} game(s)
          </p>
        </div>
      ) : null}
      <ListWrapper count={backloggedLength}>
        {[...list.entries()].map(([year, games]) => {
          return games.map((game) => <GameCard key={game.id} game={game} />)
        })}
      </ListWrapper>
    </div>
  )
}
