import { type Game, type LibraryItem } from "@prisma/client";
import Link from "next/link";

import { IgdbImage } from "@/shared/components/igdb-image";
import { type UserWithLibraryItemsResponse } from "@/shared/lib/repository/library/types";

import { getBacklogs } from "../server-actions";

const MAX_LIBRARY_ITEMS_PER_USER_CARD = 3;
const GAME_CARD_SIZE = 90;

export async function BacklogList() {
  const { data: backlogs, serverError } = await getBacklogs();

  if (serverError !== undefined) {
    return <div>{serverError}</div>;
  }

  if (!backlogs || backlogs.length === 0) {
    return (
      <>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          No other backlogs found
        </h4>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          We&apos;re not showing backlogs from users without a username
        </p>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {backlogs.map((backlog: UserWithLibraryItemsResponse) => {
        return (
          <Link
            key={backlog.user.id}
            className="w-fit text-lg font-medium"
            href={`/backlog/${backlog.user.username}`}
          >
            <div className="relative h-full w-fit min-w-[270px] rounded-md border p-3">
              <p className="text-lg font-medium">
                {backlog.user.username ?? backlog.user.name}&apos;s backlog
              </p>
              <div className="relative mt-2 h-[90px] w-full">
                {backlog.libraryItems.map(
                  (
                    libraryItem: LibraryItem & { game: Game },
                    index: number
                  ) => {
                    if (index >= MAX_LIBRARY_ITEMS_PER_USER_CARD) {
                      return null;
                    }

                    return (
                      <div
                        className="absolute top-0"
                        key={libraryItem.id}
                        style={{
                          left: (index / 2) * GAME_CARD_SIZE,
                          zIndex: index,
                        }}
                      >
                        <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
                          <div className="flex size-[90px] items-center justify-center">
                            <IgdbImage
                              className="size-full rounded-xl object-cover"
                              style={{
                                maxWidth: "100%",
                              }}
                              gameTitle={libraryItem.game.title}
                              coverImageId={libraryItem.game.coverImage}
                              igdbSrcSize={"hd"}
                              igdbImageSize={"thumb"}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
                {backlog.libraryItems.length - MAX_LIBRARY_ITEMS_PER_USER_CARD >
                0 ? (
                  <div className="absolute left-[135px] top-0 z-10 flex size-[92px] items-center justify-center rounded-xl bg-slate-200/85">
                    <span className="text-xl font-bold">
                      +&nbsp;
                      {backlog.libraryItems.length -
                        MAX_LIBRARY_ITEMS_PER_USER_CARD}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
