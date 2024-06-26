import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/shared/config/image.config";
import { BacklogItem } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type GameCardProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  backlogItems?: Omit<BacklogItem, "game">[];
};

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/game/${game.id}`} className="relative block h-40 w-fit">
      <Image
        src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.png`}
        alt={`${game.title} cover art`}
        width={NEXT_IMAGE_SIZES["logo"].width}
        height={NEXT_IMAGE_SIZES["logo"].height}
        className="rounded-md border"
      />
    </Link>
  );
}
