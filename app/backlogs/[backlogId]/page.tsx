import { auth } from "@/auth";
import { getUsersBacklog } from "@/src/entities/backlog-item";
import { getUserInfo } from "@/src/page-slices/user/api/get-user-info";
import { IMAGE_API, IMAGE_SIZES } from "@/src/shared/config/image.config";
import { BacklogStatusMapper, normalizeString } from "@/src/shared/lib";
import { Header } from "@/src/widgets/header";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function UsersBacklogPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<URLSearchParams>;
}) {
  const userGamesList = await getUsersBacklog({
    backlogId: (await props.params).backlogId,
  });
  const user = await getUserInfo((await props.params).backlogId);
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <>
      <Header />
      <div className="container">
        <h1 className="font-bold md:text-xl xl:text-2xl">
          {user?.username ?? user?.name}&apos;s Backlog
        </h1>
        <ul className="mt-2 flex flex-wrap gap-2">
          {userGamesList.map((backlogItem) => (
            <li
              key={backlogItem.id}
              className="group relative flex max-w-[160px] flex-col items-center gap-1.5 rounded border bg-background shadow"
            >
              <Image
                src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${backlogItem.game.coverImage}.webp`}
                alt={`${backlogItem.game.title} cover art`}
                width={160}
                height={160}
                className="object-cover"
              />
              <div className="absolute hidden h-full w-40 flex-col items-center justify-center gap-2 rounded bg-slate-400/95 group-hover:flex">
                <span className="text-center text-sm font-medium text-white">
                  {backlogItem.game.title}
                </span>
                <span className="text-center text-sm font-medium text-foreground text-white">
                  {BacklogStatusMapper[backlogItem.status]} |{" "}
                  {normalizeString(backlogItem.platform)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
