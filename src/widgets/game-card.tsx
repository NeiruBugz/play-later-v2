import type { Game } from "@prisma/client";
import Link from "next/link";

import { CustomImage } from "@/src/shared/ui/custom-image";

export function Card({
  game,
  path = "library",
}: {
  entityId?: string;
  game: Partial<Game>;
  path?: string;
}) {
  return (
    <div className="group w-fit rounded">
      <Link
        className="block w-fit rounded"
        href={`/${path === "lists" ? "library" : path}/${game.id}`}
      >
        <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
          <div className="flex items-center justify-center">
            <CustomImage
              alt={`${game.title ?? ""} cover art`}
              className="h-auto flex-shrink-0 rounded-xl object-cover"
              imageUrl={game.imageUrl ?? ""}
              size="logo"
              style={{
                height: "auto",
                maxWidth: "100%",
              }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
