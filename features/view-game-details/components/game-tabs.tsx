import { Suspense, type FC } from "react";

import {
  AdaptiveTabs,
  AdaptiveTabsContent,
  AdaptiveTabsList,
  AdaptiveTabsTrigger,
} from "@/shared/components";
import { type FullGameInfoResponse } from "@/shared/types";

import { About } from "./about";
import { Achievements } from "./achievements";
import { GameScreenshots } from "./game-screenshots";
import { Reviews } from "./reviews";

type GameTabsProps = {
  gameName: string;
  gameDescription: string;
  igdbGameId: number;
  genres: FullGameInfoResponse["genres"];
  releaseDates: FullGameInfoResponse["release_dates"];
  steamAppId: number | null;
};

type WithReviews =
  | {
      isReviewsDisabled: boolean;
      gameId: string;
    }
  | {
      isReviewsDisabled: boolean;
      gameId: never;
    };

export const GameTabs: FC<GameTabsProps & WithReviews> = ({
  gameName,
  gameDescription,
  igdbGameId,
  genres,
  releaseDates,
  steamAppId,
  isReviewsDisabled,
  gameId,
}) => {
  return (
    <AdaptiveTabs defaultValue="about" className="w-full">
      <AdaptiveTabsList className="w-fit">
        <AdaptiveTabsTrigger value="about" icon="📖">
          About
        </AdaptiveTabsTrigger>
        <AdaptiveTabsTrigger value="reviews" icon="⭐">
          Reviews
        </AdaptiveTabsTrigger>
        <AdaptiveTabsTrigger value="screenshots" icon="🖼️">
          Screenshots
        </AdaptiveTabsTrigger>
        {steamAppId !== null ? (
          <AdaptiveTabsTrigger value="achievements" icon="🏆">
            Achievements
          </AdaptiveTabsTrigger>
        ) : null}
      </AdaptiveTabsList>
      <AdaptiveTabsContent value="about" className="space-y-4">
        <About
          description={gameDescription}
          releaseDates={releaseDates}
          igdbId={igdbGameId}
          genres={genres}
        />
      </AdaptiveTabsContent>
      <AdaptiveTabsContent value="reviews">
        {isReviewsDisabled ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Reviews are not available for external games yet.</p>
            <p className="mt-2 text-sm">
              Add this game to your collection to leave a review!
            </p>
          </div>
        ) : (
          <Reviews gameId={gameId} />
        )}
      </AdaptiveTabsContent>
      <AdaptiveTabsContent value="screenshots">
        <Suspense fallback={"loading..."}>
          <GameScreenshots gameId={igdbGameId} gameName={gameName} />
        </Suspense>
      </AdaptiveTabsContent>
      {steamAppId !== null ? (
        <AdaptiveTabsContent value="achievements">
          <Achievements steamAppId={steamAppId} />
        </AdaptiveTabsContent>
      ) : null}
    </AdaptiveTabs>
  );
};
