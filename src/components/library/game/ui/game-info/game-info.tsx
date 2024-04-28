import type { GameResponseCombined } from "@/src/types/library/actions";

import { uniqueRecords } from "@/app/(protected)/library/lib/helpers";
import { ActionsMenu } from "@/src/components/library/game/ui/game-info/actions-menu";
import { HowLongToBeat } from "@/src/components/library/game/ui/game-info/how-long-to-beat";
import { Platforms } from "@/src/components/library/game/ui/game-info/platforms";
import { PlaythroughDialog } from "@/src/components/library/game/ui/game-info/playthrough/playthrough-create-dialog";
import { Playthroughs } from "@/src/components/library/game/ui/game-info/playthrough/playthroughs";
import { Screenshots } from "@/src/components/library/game/ui/game-info/screenshots";
import { SimilarGames } from "@/src/components/library/game/ui/game-info/similar-games";
import { Stores } from "@/src/components/library/game/ui/game-info/store/stores";
import { Summary } from "@/src/components/library/game/ui/game-info/summary";
import { Websites } from "@/src/components/library/game/ui/game-info/website/websites";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { Badge } from "@/src/components/ui/badge";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/lib/config/site";
import Image from "next/image";

export const GameInfo = ({ game }: { game: GameResponseCombined }) => {
  const {
    cover,
    external_games,
    gameplayCompletionist,
    gameplayMain,
    gameplayMainExtra,
    genres,
    name,
    release_dates,
    screenshots,
    similar_games,
    status,
    summary,
    websites,
  } = game;
  return (
    <section>
      <section className="flex flex-col-reverse gap-4 md:flex-row">
        <section className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-center gap-2 md:justify-start">
              <h1 className="text-center text-3xl font-bold tracking-tighter md:text-start lg:text-5xl">
                {name}
              </h1>
              <div className="block md:hidden">
                <ActionsMenu gameId={game.id} status={status} />
              </div>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 md:text-start">
              {genres.map((genre) => (
                <Badge className="mr-1" key={genre.id} variant="outline">
                  {genre.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="">
            <Summary summary={summary} />
          </div>
        </section>
        <div className="flex justify-center gap-1 md:justify-normal">
          <div className="flex flex-col gap-1">
            <div className="relative aspect-[3/4] h-fit w-[264px] flex-shrink-0 cursor-pointer rounded-md border transition">
              <Image
                alt={`${game.name} artwork`}
                className="rounded-md object-cover"
                height={NEXT_IMAGE_SIZES["c-big"].height}
                priority
                src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${cover?.image_id}.png`}
                width={NEXT_IMAGE_SIZES["c-big"].width}
              />
            </div>
            <PlaythroughDialog id={game.id} platforms={release_dates} />
          </div>
          <div className="hidden self-start md:block">
            <ActionsMenu gameId={game.id} status={status} />
          </div>
        </div>
      </section>

      <div className="border-gray-20 mt-4 border-y dark:border-gray-800">
        <div className="container grid max-w-4xl items-start gap-4 px-4 py-8 md:grid-cols-2 md:py-12 lg:grid-cols-3 lg:gap-8 xl:max-w-5xl xl:gap-12">
          <Playthroughs id={game.id} platforms={uniqueRecords(release_dates)} />
          <Platforms platformList={uniqueRecords(release_dates)} />
          <HowLongToBeat
            completionist={gameplayCompletionist}
            main={gameplayMain}
            mainExtra={gameplayMainExtra}
          />
        </div>
      </div>
      <Accordion collapsible type="single">
        <AccordionItem value="screenshots">
          <AccordionTrigger>Screenshots</AccordionTrigger>
          <AccordionContent>
            <Screenshots name={name} screenshots={screenshots} />
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
};
