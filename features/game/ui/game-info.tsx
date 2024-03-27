import Image from "next/image";
import Link from "next/link";
import { Game } from "@prisma/client";
import { differenceInDays, format } from "date-fns";
import { HowLongToBeatEntry } from "howlongtobeat";
import {
  FaDiscord,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaReddit,
  FaSteam,
  FaTwitch,
  FaTwitter,
  FaWikipediaW,
  FaYoutube,
} from "react-icons/fa6";
import {
  SiAmazon,
  SiEpicgames,
  SiFandom,
  SiPlaystation,
  SiSteam,
  SiXbox,
} from "react-icons/si";

import { Badge, ColorVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Icons } from "@/components/icons";
import { RenderWhen } from "@/components/render-when";

import {
  cn,
  hasSelectedPlatformInList,
  mapStatusForInfo,
  platformEnumToColor,
  uppercaseToNormal,
} from "@/lib/utils";

import type { FullGameInfoResponse } from "@/types/igdb";
import { IMAGE_API, IMAGE_SIZES } from "@/config/site";

function StoreIcon({ storeName }: { storeName: string }) {
  if (storeName.includes("steam")) {
    return <SiSteam />;
  }

  if (storeName.includes("epic")) {
    return <SiEpicgames />;
  }
  if (storeName.includes("playstation")) {
    return <SiPlaystation />;
  }
  if (storeName.includes("amazon")) {
    return <SiAmazon />;
  }
  if (storeName.includes("microsoft")) {
    return <SiXbox />;
  }
  return <></>;
}

function SiteIcon({ siteName }: { siteName: string }) {
  if (siteName.includes("twitch")) {
    return <FaTwitch />;
  }
  if (siteName.includes("discord")) {
    return <FaDiscord />;
  }
  if (siteName.includes("fandom")) {
    return <SiFandom />;
  }
  if (siteName.includes("epic")) {
    return <SiEpicgames />;
  }
  if (siteName.includes("reddit")) {
    return <FaReddit />;
  }
  if (siteName.includes("youtube")) {
    return <FaYoutube />;
  }
  if (siteName.includes("facebook")) {
    return <FaFacebook />;
  }
  if (siteName.includes("twitter")) {
    return <FaTwitter />;
  }
  if (siteName.includes("wikipedia")) {
    return <FaWikipediaW />;
  }
  if (siteName.includes("instagram")) {
    return <FaInstagram />;
  }
  if (siteName.includes("steam")) {
    return <FaSteam />;
  }
  if (siteName.includes("gog.com")) {
    return <Icons.gog />;
  }
  return <FaGlobe />;
}

function SiteLabel({ siteName }: { siteName: string }) {
  if (siteName.includes("twitch")) {
    return <span>Twitch</span>;
  }
  if (siteName.includes("discord")) {
    return <span>Discord</span>;
  }
  if (siteName.includes("fandom")) {
    return <span>Fandom</span>;
  }
  if (siteName.includes("epic")) {
    return <span>Epic Games</span>;
  }
  if (siteName.includes("reddit")) {
    return <span>Reddit</span>;
  }
  if (siteName.includes("youtube")) {
    return <span>Youtube</span>;
  }
  if (siteName.includes("facebook")) {
    return <span>Facebook</span>;
  }
  if (siteName.includes("twitter")) {
    return <span>Twitter</span>;
  }
  if (siteName.includes("wikipedia")) {
    return <span>Wikipedia</span>;
  }
  if (siteName.includes("instagram")) {
    return <span>Instagram</span>;
  }
  if (siteName.includes("steam")) {
    return <span>Steam</span>;
  }
  if (siteName.includes("gog.com")) {
    return <span>GOG.com</span>;
  }
  if (siteName.includes("fextralife")) {
    return <span>Fextralife</span>;
  }

  return <span>Official web-site</span>;
}

function SiteLink({ url }: { url: string }) {
  return (
    <Button variant="link">
      <Link
        href={url}
        target="_blank"
        className="flex max-w-[160px] items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
      >
        <SiteIcon siteName={url} />
        <SiteLabel siteName={url} />
      </Link>
    </Button>
  );
}

export function GameInfo({
  game,
}: {
  game: Game & HowLongToBeatEntry & FullGameInfoResponse;
}) {
  return (
    <section>
      <div className="mt-6 flex flex-col flex-wrap gap-4 md:flex-row">
        <div className=" relative aspect-[3/4] h-full w-[264px] cursor-pointer rounded-md border transition">
          <Image
            src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${game.cover?.image_id}.png`}
            alt={`${game.name} artwork`}
            className="rounded-md object-cover"
            unoptimized
            fill
          />
        </div>
        <div>
          <h1 className="mb-3 max-w-[600px] scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            {game.name}
          </h1>
          <div>
            <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
              Description
            </h3>
            <p className="max-w-[600px]">{game.summary}</p>
            <h3
              className={cn(
                "my-2 scroll-m-20 text-2xl font-semibold tracking-tight",
                { hidden: game.platform === undefined }
              )}
            >
              Chosen platform
            </h3>
            {game.platform ? (
              <Badge
                variant={platformEnumToColor(game.platform) as ColorVariant}
                className={cn({
                  bordered: hasSelectedPlatformInList(
                    game.platform,
                    game.platform as string
                  ),
                })}
              >
                {game.platform}
              </Badge>
            ) : null}
            <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
              Added at
            </h3>
            <p>
              {game.createdAt ? format(game.createdAt, "dd MMM, yyyy") : "-"}
            </p>
            <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
              Last updated
            </h3>
            <p>
              {game.updatedAt ? format(game.updatedAt, "dd MMM, yyyy") : "-"}
            </p>
            {differenceInDays(game.updatedAt, game.createdAt) >= 1 &&
            game.status ? (
              <p className="text-sm font-bold text-foreground">
                How long in {mapStatusForInfo(game.status)}:{" "}
                {differenceInDays(game.updatedAt, game.createdAt)} days
              </p>
            ) : null}
          </div>
        </div>
        <section>
          <h4 className="mb-3 scroll-m-20 text-xl font-semibold tracking-tight">
            Where to buy
          </h4>
          <div className="grid grid-cols-2 justify-items-start gap-1">
            {game.external_games.map((game) =>
              game.url.includes("twitch") ? null : (
                <Button key={game.id} size="sm" variant="secondary">
                  <Link
                    href={game.url}
                    target="_blank"
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
                  >
                    {game.name}
                    <StoreIcon storeName={game.url} />
                  </Link>
                </Button>
              )
            )}
          </div>
        </section>
        <div>
          <RenderWhen condition={!!game.purchaseType}>
            <section>
              <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
                Format
              </h3>
              <Badge>{uppercaseToNormal(game.purchaseType as string)}</Badge>
            </section>
          </RenderWhen>
          <RenderWhen condition={game.platforms.length !== 0}>
            <section>
              <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
                Releases
              </h3>
              <ul className="flex flex-wrap gap-1">
                {game.release_dates.map((releaseDate) => {
                  return (
                    <>
                      <Badge
                        key={releaseDate.id}
                        variant={
                          platformEnumToColor(
                            releaseDate.platform.name
                          ) as ColorVariant
                        }
                        className={cn({
                          bordered: hasSelectedPlatformInList(
                            releaseDate.platform.name,
                            game.platform as string
                          ),
                        })}
                      >
                        {releaseDate.platform.name}&nbsp;(Release Date:{" "}
                        {releaseDate.human})
                      </Badge>
                    </>
                  );
                })}
              </ul>
            </section>
          </RenderWhen>
          <section>
            <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
              Beating times
            </h3>
            <section className="flex max-w-fit items-center gap-4 border-y-2">
              <div className="p-2">
                <p className="font-medium leading-7">Main </p>
                <p className="leading-7">{game.gameplayMain} h</p>
              </div>
              <div className="border-x-2 p-2">
                <p className="font-medium leading-7">Main + Extra</p>
                <p className="leading-7">{game.gameplayMainExtra} h</p>
              </div>
              <div className="p-2">
                <p className="font-medium leading-7">Completionist</p>
                <p className="leading-7">{game.gameplayCompletionist} h</p>
              </div>
            </section>
          </section>
        </div>
      </div>

      <section className="container mx-auto py-4 md:py-6">
        <h4 className="mb-3 scroll-m-20 text-xl font-semibold tracking-tight">
          Screenshots
        </h4>
        <Carousel opts={{ loop: true }}>
          <CarouselContent>
            {game.screenshots.map((screenshot) => {
              return (
                <div
                  key={screenshot.id}
                  className="relative mx-4 aspect-[16/9] h-[320px] w-[569px] cursor-pointer border transition"
                >
                  <Image
                    src={`${IMAGE_API}/${IMAGE_SIZES["s-md"]}/${screenshot.image_id}.png`}
                    alt={`${game.name} screenshot`}
                    className="object-cover"
                    height={320}
                    width={569}
                    priority
                  />
                </div>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>
      <h4 className="mb-3 scroll-m-20 text-xl font-semibold tracking-tight">
        Websites
      </h4>
      <div className="grid grid-cols-[170px_minmax(170px,_1fr)] justify-items-start gap-1">
        {game.websites.map((site) => (
          <SiteLink url={site.url} key={site.id} />
        ))}
      </div>
    </section>
  );
}
