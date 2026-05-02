import { getDisplayProfile } from "@/features/profile/index.server";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { SidebarUserMenu } from "./sidebar-user-menu";

interface SidebarUserProps {
  userId: string;
}

export async function SidebarUser({ userId }: SidebarUserProps) {
  const { displayName, avatarUrl } = await getDisplayProfile({ userId });
  return <SidebarUserMenu displayName={displayName} avatarUrl={avatarUrl} />;
}

export function SidebarUserSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-24 group-data-[collapsible=icon]:hidden" />
    </div>
  );
}
