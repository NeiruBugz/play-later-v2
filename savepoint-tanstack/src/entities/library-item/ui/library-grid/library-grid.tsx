import type { LibraryGridProps } from "./library-grid.type";

export function LibraryGrid({ games }: LibraryGridProps) {
  if (games.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="library-grid-root"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      {games.map((game) => (
        <div
          key={game.gameId}
          data-testid="library-grid-item"
          aria-label={game.title}
          className="group relative block"
        >
          <div className="relative overflow-hidden rounded-lg">
            {game.coverImage ? (
              <img
                src={game.coverImage}
                alt={game.title}
                className="aspect-[3/4] w-full object-cover"
              />
            ) : (
              <div
                className="bg-muted aspect-[3/4] w-full"
                aria-hidden="true"
              />
            )}
          </div>
          <p className="body-sm mt-2 line-clamp-2 font-medium">{game.title}</p>
        </div>
      ))}
    </div>
  );
}
