import { getServerUserId } from "@/auth";
import { CollectionService } from "@/data-access-layer/services";
import { redirect } from "next/navigation";

import { CollectionView } from "@/features/collection/ui";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/login");
  }

  const collectionService = new CollectionService();
  const platformsResult = await collectionService.getUserPlatforms(userId);

  const platforms = platformsResult.success ? (platformsResult.data ?? []) : [];

  return (
    <div className="container mx-auto py-8">
      <CollectionView availablePlatforms={platforms} />
    </div>
  );
}
