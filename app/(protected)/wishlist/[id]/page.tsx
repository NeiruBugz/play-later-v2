import { GameInfo } from "@/app/(protected)/library/components/game/ui/game-info/game-info";
import { getGameWithAdapter } from "@/app/(protected)/library/lib/actions/get-game";
import { auth } from "@/auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { notFound, redirect } from "next/navigation";

export default async function GamePage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }
  const gameInfo = await getGameWithAdapter({
    gameId: params.id,
    isFromWishlist: true,
  });

  if (!gameInfo) {
    notFound();
  }

  return (
    <div className="px-4 md:container">
      <header className="mb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-xl" href="/wishlist">
                Wishlist
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xl">
                {gameInfo.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <GameInfo game={gameInfo} />
    </div>
  );
}
