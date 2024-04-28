import Image from "next/image";
import Link from "next/link";

import { IMAGE_API, IMAGE_SIZES, NEXT_IMAGE_SIZES } from "@/lib/config/site";
import { isURL } from "@/lib/utils";

import { getList } from "./actions/get-list";

type BackloggedWithUser = {
  id: string;
  imageUrl: string;
  title: string;
  user: {
    name?: string | null;
    username?: string | null;
  };
};

export default async function BacklogsPage() {
  const backlogs = await getList();
  return (
    <section className="relative">
      <header className="container sticky top-0 z-40 bg-background">
        <div className="flex flex-wrap justify-between">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Backlogs
          </h1>
        </div>
      </header>
      <div className="container mt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {backlogs &&
            Object.keys(backlogs).map((backlogKey) => {
              return (
                <Link
                  href={`/backlogs/${backlogKey}`}
                  className="w-fit text-lg font-medium"
                >
                  <div
                    key={backlogKey}
                    className="relative h-full w-fit min-w-[270px] rounded-md border p-3"
                  >
                    <p className="text-lg font-medium">
                      {backlogKey}&apos;s backlog
                    </p>
                    <div className="relative mt-2 h-[90px] w-full">
                      {(
                        backlogs[
                          backlogKey as keyof typeof backlogs
                        ] as unknown as BackloggedWithUser[]
                      ).map((backlogItem, index) => {
                        if (index >= 3) {
                          return;
                        }

                        const imageUrl = isURL(backlogItem.imageUrl)
                          ? backlogItem.imageUrl
                          : `${IMAGE_API}/${IMAGE_SIZES["hd"]}/${backlogItem.imageUrl}.png`;
                        return (
                          <div
                            key={backlogItem.id}
                            className="absolute top-0"
                            style={{
                              left: (index / 2) * 90,
                              zIndex: index,
                            }}
                          >
                            <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
                              <div className="flex size-[90px] items-center justify-center">
                                <Image
                                  src={imageUrl}
                                  alt={`${backlogItem.title} cover art`}
                                  width={NEXT_IMAGE_SIZES.thumb.width}
                                  height={NEXT_IMAGE_SIZES.thumb.height}
                                  style={{
                                    maxWidth: "100%",
                                  }}
                                  className="h-full w-full rounded-xl object-cover"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(
                        backlogs[
                          backlogKey as keyof typeof backlogs
                        ] as unknown as BackloggedWithUser[]
                      ).length - 3 ? (
                        <div className="absolute left-[135px] top-0 z-10 flex size-[92px] items-center justify-center rounded-xl bg-slate-200/85">
                          <span className="text-xl font-bold">
                            +&nbsp;
                            {(
                              backlogs[
                                backlogKey as keyof typeof backlogs
                              ] as unknown as BackloggedWithUser[]
                            ).length - 3}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </section>
  );
}
