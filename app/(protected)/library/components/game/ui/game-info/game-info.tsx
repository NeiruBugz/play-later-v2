import { Fragment } from "react";
import Image from "next/image";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import type { FullGameInfoResponse } from "@/lib/types/igdb";

import { ActionsMenu } from "@/app/(protected)/library/components/game/ui/game-info/actions-menu";
import { HowLongToBeat } from "@/app/(protected)/library/components/game/ui/game-info/how-long-to-beat";
import { Platforms } from "@/app/(protected)/library/components/game/ui/game-info/platforms";
import { PlaythroughDialog } from "@/app/(protected)/library/components/game/ui/game-info/playthrough-dialog";
import { Playthroughs } from "@/app/(protected)/library/components/game/ui/game-info/playthroughs";
import { Screenshots } from "@/app/(protected)/library/components/game/ui/game-info/screenshots";
import { SimilarGames } from "@/app/(protected)/library/components/game/ui/game-info/similar-games";
import { Stores } from "@/app/(protected)/library/components/game/ui/game-info/stores";
import { Summary } from "@/app/(protected)/library/components/game/ui/game-info/summary";
import { Timestamps } from "@/app/(protected)/library/components/game/ui/game-info/timestamps";
import { Websites } from "@/app/(protected)/library/components/game/ui/game-info/websites";
import type { GameResponseCombined } from "@/app/(protected)/library/lib/types/actions";

const uniqueRecords = (records: FullGameInfoResponse["release_dates"]) =>
  records && records.length
    ? records.filter(
        (record, index, self) =>
          index ===
          self.findIndex(
            (r) =>
              r.human === record.human &&
              r.platform.name === record.platform.name
          )
      )
    : records;

export function GameInfo({ game }: { game: GameResponseCombined }) {
  const {
    summary,
    name,
    status,
    createdAt,
    updatedAt,
    gameplayMain,
    gameplayMainExtra,
    gameplayCompletionist,
    release_dates,
    screenshots,
    external_games,
    websites,
    similar_games,
    cover,
    genres,
  } = game;
  return (
    <section>
      <section className="flex flex-col-reverse gap-4 md:flex-row">
        <section className="space-y-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tighter lg:text-5xl">
              {name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {genres.map((genre, index) => (
                <Fragment key={genre.id}>
                  {genre.name} {index === genres.length - 1 ? "" : ", "}
                </Fragment>
              ))}
            </p>
          </div>
          <div className="">
            <Summary summary={summary} />
          </div>
        </section>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1">
            <div className="relative aspect-[3/4] h-fit w-[264px] flex-shrink-0 cursor-pointer rounded-md border transition">
              <Image
                width={264}
                height={352}
                src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${cover?.image_id}.png`}
                alt={`${game.name} artwork`}
                className="rounded-md object-cover"
                priority
              />
            </div>
            <PlaythroughDialog id={game.id} platforms={release_dates} />
          </div>
          <div className="self-start">
            <ActionsMenu gameId={game.id} status={status} />
          </div>
        </div>
      </section>

      <div className="border-gray-20 mt-4 border-y dark:border-gray-800">
        <div className="container grid max-w-4xl items-start gap-4 px-4 py-8 md:grid-cols-2 md:py-12 lg:grid-cols-3 lg:gap-8 xl:max-w-5xl xl:gap-12">
          <Playthroughs id={game.id} />
          <Platforms platformList={uniqueRecords(release_dates)} />
          <HowLongToBeat
            main={gameplayMain}
            mainExtra={gameplayMainExtra}
            completionist={gameplayCompletionist}
          />
          <Timestamps
            createdAt={createdAt}
            updatedAt={updatedAt}
            status={status}
          />
        </div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="screenshots">
          <AccordionTrigger>Screenshots</AccordionTrigger>
          <AccordionContent>
            <Screenshots screenshots={screenshots} name={name} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="websites">
          <AccordionTrigger>Websites</AccordionTrigger>
          <AccordionContent>
            {websites?.length ? <Websites sites={websites} /> : null}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="stores">
          <AccordionTrigger>Where to buy</AccordionTrigger>
          <AccordionContent>
            {external_games?.length ? <Stores stores={external_games} /> : null}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="similar-games">
          <AccordionTrigger>Similar games</AccordionTrigger>
          <AccordionContent>
            {similar_games?.length ? (
              <SimilarGames gamesList={similar_games} />
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
