import { StoreIcon } from "@/src/components/library/game/game-info/store/store-icon";
import { Button } from "@/src/components/ui/button";
import { FullGameInfoResponse } from "@/src/packages/types/igdb";
import Link from "next/link";


export const Stores = ({
  stores,
}: {
  stores: FullGameInfoResponse["external_games"];
}) => (
  <section className="my-2">
    <div className="grid grid-cols-1 justify-items-start gap-2 md:grid-cols-2">
      {stores.map((game) => {
        if (!game.url || !game.name) {
          return;
        }
        return game?.url?.includes("twitch") ? null : (
          <Button key={game.id} size="sm" variant="secondary">
            <Link
              className="my-2 flex items-center gap-2 whitespace-nowrap text-sm font-medium text-gray-500 transition hover:text-gray-700"
              href={game.url}
              target="_blank"
            >
              {game.name}
              <StoreIcon storeName={game.url} />
            </Link>
          </Button>
        );
      })}
    </div>
  </section>
);
