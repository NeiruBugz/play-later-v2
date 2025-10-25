import { getServerUserId } from "@/auth";
import { findGameById } from "@/data-access-layer/repository";
import { LibraryService } from "@/data-access-layer/services";
import { ArrowLeft, Calendar, Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { buildIgdbImageUrl } from "@/shared/lib/igdb/igdb-image-utils";
import {
  cn,
  LibraryStatusColorMapper,
  LibraryStatusMapper,
} from "@/shared/lib/ui";

interface GameDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;
  const game = await findGameById({ id });

  if (!game) {
    notFound();
  }

  const libraryService = new LibraryService();

  const libraryItemsResult = await libraryService.getLibraryItems({
    userId,
    gameId: id,
  });

  const coverUrl = game.coverImage ? buildIgdbImageUrl(game.coverImage) : null;

  const releaseDate = game.releaseDate
    ? new Date(game.releaseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/library" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-col gap-6 md:flex-row">
        <div className="bg-muted relative h-[400px] w-full overflow-hidden rounded-lg md:w-[300px]">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`Cover art for ${game.title}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gamepad2 className="text-muted-foreground h-24 w-24" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-4xl font-bold">{game.title}</h1>
            {releaseDate && (
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Released: {releaseDate}
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <h2 className="mb-2 text-xl font-semibold">About</h2>
            <p className="text-muted-foreground">
              Game details and description will be displayed here.
            </p>
          </div>

          <div className="border-t pt-4">
            <h2 className="mb-2 text-xl font-semibold">Your Library Entries</h2>
            {libraryItemsResult.success ? (
              libraryItemsResult.data.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <p className="text-muted-foreground">{item.platform}</p>
                  <Badge
                    className={cn(
                      "text-muted-foreground",
                      "border font-medium",
                      LibraryStatusColorMapper[item.status]
                    )}
                  >
                    {LibraryStatusMapper[item.status]}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No library entries found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          This is a placeholder game detail page. Full functionality coming
          soon!
        </p>
      </div>
    </div>
  );
}
