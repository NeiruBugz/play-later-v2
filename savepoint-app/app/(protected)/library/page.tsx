import { LibraryPageView } from "@/features/library/ui";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";
export default async function LibraryPage() {
  await requireServerUserId();
  return <LibraryPageView />;
}
