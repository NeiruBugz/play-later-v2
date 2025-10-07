import type { Game, LibraryItem, User } from "@prisma/client";
import Link from "next/link";

import { EmptyState, ErrorState, ListPagination } from "@/shared/components";
import { IgdbImage } from "@/shared/components/igdb-image";

import { getBacklogs } from "../server-actions";

type UserBacklog = {
  user: User;
  previewItems: (LibraryItem & { game: Game })[];
  totalCount: number;
};

const MAX_LIBRARY_ITEMS_PER_USER_CARD = 3;
const GAME_CARD_SIZE = 90;

export async function BacklogList(props: {
  params: Record<string, string | string[] | undefined>;
}) {
  const { params } = props;
  const page = Number(params.page ?? 1) || 1;
  const search = (params.search as string) || undefined;

  const { data, serverError } = await getBacklogs({ page, limit: 24, search });

  if (serverError) {
    return <ErrorState message={serverError} />;
  }

  const users = data?.users ?? [];
  const count = data?.count ?? 0;

  if (!users.length) {
    return (
      <EmptyState
        title="No other backlogs found"
        description="We don't show backlogs from users without a username"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((backlog: UserBacklog) => {
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
                  {backlog.previewItems.map(
                    (
                      libraryItem: LibraryItem & { game: Game },
                      index: number
                    ) => {
                      if (index >= MAX_LIBRARY_ITEMS_PER_USER_CARD) return null;
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
                                style={{ maxWidth: "100%" }}
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
                  {backlog.totalCount - MAX_LIBRARY_ITEMS_PER_USER_CARD > 0 ? (
                    <div className="absolute left-[135px] top-0 z-10 flex size-[92px] items-center justify-center rounded-xl bg-slate-200/85">
                      <span className="text-xl font-bold">
                        +&nbsp;
                        {backlog.totalCount - MAX_LIBRARY_ITEMS_PER_USER_CARD}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="flex justify-center">
        <ListPagination total={count} pageSize={24} basePath="/backlog" />
      </div>
    </div>
  );
}
