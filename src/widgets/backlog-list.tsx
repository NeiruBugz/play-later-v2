import { getBacklogs } from "@/src/entities/backlog-item";
import { IgdbImage } from "@/src/shared/ui/igdb-image";
import Link from "next/link";

export async function BacklogList() {
  const backlogs = await getBacklogs();

  if (backlogs.length === 0) {
    return (
      <>
        <h1 className="text-3xl font-bold">No other backlogs found</h1>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {backlogs.map((backlog) => {
        return (
          <Link
            key={backlog.user.id}
            className="w-fit text-lg font-medium"
            href={`/backlogs/${backlog.user.id}`}
          >
            <div className="relative h-full w-fit min-w-[270px] rounded-md border p-3">
              <p className="text-lg font-medium">
                {backlog.user.username ?? backlog.user.name}&apos;s backlog
              </p>
              <div className="relative mt-2 h-[90px] w-full">
                {backlog.backlogItems.map((backlogItem, index) => {
                  if (index >= 3) {
                    return;
                  }

                  return (
                    <div
                      className="absolute top-0"
                      key={backlogItem.id}
                      style={{
                        left: (index / 2) * 90,
                        zIndex: index,
                      }}
                    >
                      <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
                        <div className="flex size-[90px] items-center justify-center">
                          <IgdbImage
                            className="h-full w-full rounded-xl object-cover"
                            style={{
                              maxWidth: "100%",
                            }}
                            gameTitle={backlogItem.game.title}
                            coverImageId={backlogItem.game.coverImage}
                            igdbSrcSize={"hd"}
                            igdbImageSize={"thumb"}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {backlog.backlogItems.length - 3 > 0 ? (
                  <div className="absolute left-[135px] top-0 z-10 flex size-[92px] items-center justify-center rounded-xl bg-slate-200/85">
                    <span className="text-xl font-bold">
                      +&nbsp;
                      {backlog.backlogItems.length - 3}
                    </span>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
