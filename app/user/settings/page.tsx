import { getServerUserId } from "@/auth";
import { IntegrationsList } from "@/features/manage-integrations/components/integrations-list";
import { EditUserForm } from "@/features/manage-user-info/components/edit-user-form";
import { getUserInfo } from "@/features/manage-user-info/server-actions/get-user-info";
import {
  AdaptiveTabs,
  AdaptiveTabsContent,
  AdaptiveTabsList,
  AdaptiveTabsTrigger,
} from "@/shared/components/adaptive-tabs";
import { Header } from "@/shared/components/header";
import { notFound } from "next/navigation";

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; tab?: string }>;
}) {
  const userId = await getServerUserId();

  if (!userId) {
    return notFound();
  }

  const user = await getUserInfo(userId);

  if (!user) {
    return notFound();
  }

  const { error, success, tab } = await searchParams;

  // Show notifications based on URL parameters
  if (error === "steam_already_connected") {
    // Show error: "This Steam account is already connected to another user"
  }
  if (success === "steam_connected") {
    // Show success: "Steam account connected successfully!"
  }

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="container relative px-4 pt-[80px]">
          <AdaptiveTabs defaultValue={tab ?? "settings"} className="w-full">
            <AdaptiveTabsList className="w-fit">
              <AdaptiveTabsTrigger value="settings">
                Settings
              </AdaptiveTabsTrigger>
              <AdaptiveTabsTrigger value="integrations">
                Integrations
              </AdaptiveTabsTrigger>
            </AdaptiveTabsList>
            <AdaptiveTabsContent value="settings" className="space-y-4">
              <EditUserForm userInfo={user} />
            </AdaptiveTabsContent>
            <AdaptiveTabsContent value="integrations">
              <IntegrationsList />
            </AdaptiveTabsContent>
          </AdaptiveTabs>
        </div>
      </div>
    </div>
  );
}
