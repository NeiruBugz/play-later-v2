import { Counter } from "@/src/components/backlogs/counter";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/lib/config/site";
import { isURL } from "@/src/lib/utils";
import { BackloggedWithUser } from "@/src/types/backlogs";
import Image from "next/image";
import Link from "next/link";

export const UserBacklog = ({
  backlogList,
  username,
}: {
  backlogList: BackloggedWithUser[];
  username: string;
}) => {
  return (
    <Link className="w-fit text-lg font-medium" href={`/backlogs/${username}`}>
      <div className="relative h-full w-fit min-w-[270px] rounded-md border p-3">
        <p className="text-lg font-medium">{username}&apos;s backlog</p>
        <div className="relative mt-2 h-[90px] w-full">
          {backlogList.map((backlogItem, index) => {
            if (index >= 3) {
              return;
            }

            const imageUrl = isURL(backlogItem.imageUrl)
              ? backlogItem.imageUrl
              : `${IMAGE_API}/${IMAGE_SIZES["hd"]}/${backlogItem.imageUrl}.png`;
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
                    <Image
                      alt={`${backlogItem.title} cover art`}
                      className="h-full w-full rounded-xl object-cover"
                      height={NEXT_IMAGE_SIZES.thumb.height}
                      src={imageUrl}
                      style={{
                        maxWidth: "100%",
                      }}
                      width={NEXT_IMAGE_SIZES.thumb.width}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <Counter backlogList={backlogList} />
        </div>
      </div>
    </Link>
  );
};
