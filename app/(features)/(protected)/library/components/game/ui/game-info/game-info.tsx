import Image from "next/image";
import { Game } from "@prisma/client";
import { HowLongToBeatEntry } from "howlongtobeat";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import type { FullGameInfoResponse } from "@/lib/types/igdb";

import { Platform } from "@/app/(features)/(protected)/library/components/game/ui/game-info/platform";
import { Platforms } from "@/app/(features)/(protected)/library/components/game/ui/game-info/platforms";
import { Screenshots } from "@/app/(features)/(protected)/library/components/game/ui/game-info/screenshots";
import { SimilarGames } from "@/app/(features)/(protected)/library/components/game/ui/game-info/similar-games";
import { Stores } from "@/app/(features)/(protected)/library/components/game/ui/game-info/stores";
import { Summary } from "@/app/(features)/(protected)/library/components/game/ui/game-info/summary";
import { Timestamps } from "@/app/(features)/(protected)/library/components/game/ui/game-info/timestamps";
import { Websites } from "@/app/(features)/(protected)/library/components/game/ui/game-info/websites";

const uniqueRecords = (records: FullGameInfoResponse["release_dates"]) =>
  records.filter(
    (record, index, self) =>
      index ===
      self.findIndex(
        (r) =>
          r.human === record.human && r.platform.name === record.platform.name
      )
  );

export function GameInfo({
  game,
}: {
  game: Game & HowLongToBeatEntry & FullGameInfoResponse;
}) {
  return (
    <section>
      <section className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative aspect-[3/4] h-full w-[264px] flex-shrink-0 cursor-pointer rounded-md border transition">
          <Image
            width={264}
            height={352}
            src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${game.cover?.image_id}.png`}
            alt={`${game.name} artwork`}
            className="rounded-md object-cover"
            priority
          />
        </div>
        <div className="max-h-[352px]">
          <h1 className="mb-3 max-w-[600px] scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            {game.name}
          </h1>
          <Summary summary={game.summary} />
        </div>
        <div className="flex flex-col gap-2 whitespace-nowrap">
          <Platform platform={game.platform} />
          <Timestamps
            createdAt={game.createdAt}
            updatedAt={game.updatedAt}
            status={game.status}
          />
        </div>
      </section>
      <Platforms
        platformList={uniqueRecords(game.release_dates)}
        selectedPlatform={game.platform}
      />
      <Screenshots screenshots={game.screenshots} name={game.name} />
      <Stores stores={game.external_games} />
      <Websites sites={game.websites} />
      <SimilarGames gamesList={game.similar_games} />
    </section>
  );
}
