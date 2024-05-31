import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/ui/accordion";
import { Badge } from "@/src/shared/ui/badge";
import { CustomImage } from "@/src/shared/ui/custom-image";

import type { GameResponseCombined } from "@/src/entities/game/types";

import { PlaythroughDialog } from "@/src/features/create-playthrough";
import { ReviewCreateDialog } from "@/src/features/create-review";

import { ActionsMenu } from "./actions-menu";
import { HowLongToBeat } from "./how-long-to-beat";
import { Platforms } from "./platforms";
import { Playthroughs } from "./playthrough";
import { ReviewList } from "./review-list";
import { Screenshots } from "./screenshots";
import { SimilarGames } from "./similar-games";
import { Stores } from "./store";
import { Summary } from "./summary";
import { Websites } from "./website";

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
              <CustomImage
                alt={`${game.name} artwork`}
                className="rounded-md object-cover"
                imageUrl={cover?.image_id}
                priority
                size="c-big"
              />
            </div>
            <PlaythroughDialog id={game.id} platforms={release_dates} />
            <ReviewCreateDialog gameId={game.id} />
          </div>
          <div className="hidden self-start md:block">
            <ActionsMenu gameId={game.id} status={status} />
          </div>
        </div>
      </section>

      <div className="border-gray-20 mt-4 border-y dark:border-gray-800">
        <div className="container grid max-w-4xl items-start gap-4 px-4 py-8 md:grid-cols-2 md:py-12 lg:grid-cols-3 lg:gap-8 xl:max-w-5xl xl:gap-12">
          <Playthroughs id={game.id} platforms={release_dates} />
          <Platforms platformList={release_dates} />
          <HowLongToBeat
            completionist={gameplayCompletionist}
            main={gameplayMain}
            mainExtra={gameplayMainExtra}
          />
        </div>
      </div>
      <Accordion collapsible type="single">
        <AccordionItem value="reviews">
          <AccordionTrigger>Reviews</AccordionTrigger>
          <AccordionContent>
            <ReviewList
              gameId={game.id}
              imageUrl={game.imageUrl}
              name={game.title}
            />
          </AccordionContent>
        </AccordionItem>
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
