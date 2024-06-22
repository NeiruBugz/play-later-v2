import { IMAGE_API, IMAGE_SIZES, NEXT_IMAGE_SIZES } from "@/src/shared/config/image.config";
import Image from 'next/image'
import { BacklogItem } from "@prisma/client";

type GameCardProps = {
  game: {
    id: number;
    title: string;
    coverImage: string | null;
  };
  backlogItems: Omit<BacklogItem, 'game'>[];
};

export function GameCard({ game, backlogItems }: GameCardProps) {
  return (
    <div>
      <div className="relative w-fit">
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES['hd']}/${game.coverImage}.png`}
          alt={`${game.title} cover art`}
          width={NEXT_IMAGE_SIZES['c-big'].width}
          height={NEXT_IMAGE_SIZES['c-big'].height}
          className="rounded-md border"
        />
        {/*<div className="absolute top-4 right-2">*/}
        {/*  <DeleteGame gameId={backlogItemId}/>*/}
        {/*</div>*/}
      </div>
      {/*<div className="p-4 max-w-[264px]">*/}
      {/*  <Link href={`/collection/${game.id}`} className="hover:underline">*/}
      {/*    <h2 className="text-lg font-bold mb-2">{game.title}</h2>*/}
      {/*  </Link>*/}
      {/*  {backlogItems.map(({ status, platform, id }) => (*/}
      {/*      <div key={id} className="mb-2 last:mb-0">*/}
      {/*        <div className={cn("flex items-center gap-2 mb-2", { hidden: platform === null })}>*/}
      {/*          <GamepadIcon className="w-4 h-4"/>*/}
      {/*          <span className="text-muted-foreground">{platform}</span>*/}
      {/*        </div>*/}
      {/*        <div className="flex items-center gap-2 text-muted-foreground">*/}
      {/*          <PlayIcon className="w-4 h-4"/>*/}
      {/*          <span>{BacklogStatusMapper[status]}</span>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*    )*/}
      {/*  )}*/}
      {/*</div>*/}
    </div>
  )
    ;
}
