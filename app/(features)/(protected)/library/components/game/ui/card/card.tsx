import Link from "next/link";
import { Game } from "@prisma/client";

import { Artwork } from "./artwork";

export function Card({
  game,
  path = "library",
}: {
  game: Partial<Game>;
  path?: string;
  entityId?: string;
}) {
  return (
    <div className="group w-fit rounded">
      <Link
        href={`/${path === "lists" ? "library" : path}/${game.id}`}
        className="block w-fit rounded"
      >
        <Artwork game={game} />
      </Link>
    </div>
  );
}
