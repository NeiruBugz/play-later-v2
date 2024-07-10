import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";
import { IMAGE_API, IMAGE_SIZES } from "@/src/shared/config/image.config";
import {
  BacklogStatusMapper,
  cn,
  normalizeString,
  platformToBackgroundColor,
} from "@/src/shared/lib";
import { Button } from "@/src/shared/ui";
import { Badge } from "@/src/shared/ui/badge";
import { EllipsisIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ListView({
  backlogItems,
}: {
  backlogItems: GameWithBacklogItems[];
}) {
  return (
    <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="relative col-span-1 md:col-span-2 lg:col-span-3">
        <div className="relative max-h-[600px] min-h-[600px] overflow-auto overflow-x-auto rounded-lg bg-white">
          <table className="relative min-w-full bg-white">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr className="border-b">
                <th className="px-4 py-1 text-start">Game Title</th>
                <th className="px-4 py-1 text-start">Status</th>
                <th className="px-4 py-1 text-start">Platform</th>
                <th className="px-4 py-1 text-start">Actions</th>
              </tr>
            </thead>
            <tbody className="max-h-[600px] min-h-[600px] overflow-auto">
              {backlogItems.map(({ game, backlogItems }) => (
                <tr key={game.id} className="border-b py-1">
                  <td >
                    <div className="flex items-center gap-2 px-4 py-2 font-medium underline w-fit">
                    <Image
                      src={`${IMAGE_API}/${IMAGE_SIZES["logo"]}/${game.coverImage}.png`}
                      alt={`${game.title} cover`}
                      width={40}
                      height={40}
                    />
                    <Link href={`/game/${game.id}`} className="text-pretty w-fit hover:text-slate-500">{game.title}</Link></div>
                  </td>
                  <td className="border-l px-4 py-1">
                    {backlogItems.map((item) => (
                      <Badge key={item.id} className="mr-1 last-of-type:mr-0">
                        {BacklogStatusMapper[item.status]}
                      </Badge>
                    ))}
                  </td>
                  <td className="border-x px-4 py-1">
                    {backlogItems.map((item) => (
                      <Badge
                        className={cn(
                          "mr-1 last-of-type:mr-0 mb-1",
                          platformToBackgroundColor(item.platform as string)
                        )}
                        key={`platform_${item.id}`}
                      >
                        {normalizeString(item.platform)}
                      </Badge>
                    ))}
                  </td>
                  <td className="px-4 py-1 text-center">
                    <Button variant="ghost">
                      <EllipsisIcon />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
