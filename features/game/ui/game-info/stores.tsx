import Link from "next/link";
import { StoreIcon } from "@/features/game/ui/game-info/store-icon";

import { Button } from "@/components/ui/button";

import { FullGameInfoResponse } from "@/types/igdb";

export const Stores = ({
  stores,
}: {
  stores: FullGameInfoResponse["external_games"];
}) => (
  <section>
    <h4 className="mb-3 scroll-m-20 text-xl font-semibold tracking-tight">
      Where to buy
    </h4>
    <div className="grid grid-cols-2 justify-items-start gap-2">
      {stores.map((game) =>
        game.url.includes("twitch") ? null : (
          <Button key={game.id} size="sm" variant="secondary">
            <Link
              href={game.url}
              target="_blank"
              className="my-2 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
            >
              {game.name}
              <StoreIcon storeName={game.url} />
            </Link>
          </Button>
        )
      )}
    </div>
  </section>
);
