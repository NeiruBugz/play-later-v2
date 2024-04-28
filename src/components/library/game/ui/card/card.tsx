import { Game } from "@prisma/client";
import Link from "next/link";

import { Artwork } from "./artwork";

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
        <Artwork game={game} />
      </Link>
    </div>
  );
}
