import { ProfileService } from "@/data-access-layer/services";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ImportedGamesContainer } from "@/features/steam-import/ui";
import { Button } from "@/shared/components/ui/button";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";

export default async function SteamGamesPage() {
  const userId = await requireServerUserId();

  const profileService = new ProfileService();
  const steamStatusResult = await profileService.getSteamConnectionStatus({
    userId,
  });

  if (!steamStatusResult.success || !steamStatusResult.data.connected) {
    redirect("/profile");
  }

  return (
    <div className="py-3xl container mx-auto">
      <div className="mb-2xl gap-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="gap-md flex items-center">
          <Button asChild variant="ghost" size="icon">
            <Link href="/library" aria-label="Back to library">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="heading-xl">Import from Steam</h1>
            <p className="text-muted-foreground text-sm">
              Select games from your Steam library to add to SavePoint
            </p>
          </div>
        </div>
      </div>
      <ImportedGamesContainer />
    </div>
  );
}
