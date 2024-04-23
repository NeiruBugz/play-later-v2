import Image from "next/image";
import Link from "next/link";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";

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
  console.log(backlogs);
  return (
    <section className="relative">
      <header className="container sticky top-0 z-40 bg-background">
        <div className="flex flex-wrap justify-between">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Backlogs
          </h1>
        </div>
      </header>
      <div className="container">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {backlogs &&
            Object.keys(backlogs).map((backlogKey) => {
              return (
                <div key={backlogKey}>
                  <Link href={`/backlogs/${backlogKey}`}>
                    {backlogKey}&apos;s backlog
                  </Link>
                  {(
                    backlogs[
                      backlogKey as keyof typeof backlogs
                    ] as unknown as BackloggedWithUser[]
                  ).map((backlogItem) => {
                    return (
                      <div key={backlogItem.id}>
                        {backlogItem.title}
                        <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
                          <div className="flex size-[90px] items-center justify-center">
                            <Image
                              src={`${IMAGE_API}/${IMAGE_SIZES["thumb"]}/${backlogItem.imageUrl}.png`}
                              alt={`${backlogItem.title} cover art`}
                              width={90}
                              height={90}
                              style={{
                                maxWidth: "100%",
                                height: "auto",
                              }}
                              className="h-full w-full rounded-xl object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
