import Link from "next/link";

import { Button } from "@/components/ui/button";

import { FullGameInfoResponse } from "@/lib/types/igdb";

import { StoreIcon } from "@/app/(features)/(protected)/library/components/game/ui/game-info/store-icon";

export const Stores = ({
  stores,
}: {
  stores: FullGameInfoResponse["external_games"];
}) => (
  <section className="my-2">
    <h4 className="mb-3 scroll-m-20 text-xl font-semibold tracking-tight">
      Where to buy
    </h4>
    <div className="grid grid-cols-1 justify-items-start gap-2 md:grid-cols-2">
      {stores.map((game) => {
        if (!game.url || !game.name) {
          return;
        }
        return game?.url?.includes("twitch") ? null : (
          <Button key={game.id} size="sm" variant="secondary">
            <Link
              href={game.url}
              target="_blank"
              className="my-2 flex items-center gap-2 whitespace-nowrap text-sm font-medium text-gray-500 transition hover:text-gray-700"
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
