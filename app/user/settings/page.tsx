import { notFound } from "next/navigation";
import { z } from "zod";

import { IntegrationsList } from "@/features/manage-integrations";
import { EditUserForm, getUserInfo } from "@/features/manage-user-info";
import {
  AdaptiveTabs,
  AdaptiveTabsContent,
  AdaptiveTabsList,
  AdaptiveTabsTrigger,
} from "@/shared/components/adaptive-tabs";
import { EditorialHeader } from "@/shared/components/header";

const TabsSchema = z.object({
  tab: z.enum(["settings", "integrations"]).optional(),
});

export const dynamic = "force-dynamic";

export default async function UserPage(props: PageProps<"/user/settings">) {
  const searchParams = await props.searchParams;
  const { data: user, serverError } = await getUserInfo();

  if (serverError != null) {
    throw new Error(serverError);
  }

  if (!user) {
    return notFound();
  }

  const { tab } = searchParams;

  const parsedTab = TabsSchema.parse({ tab });

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col bg-background">
        <EditorialHeader authorized={true} />
        <div className="container relative px-4 pt-[80px]">
          <AdaptiveTabs
            defaultValue={parsedTab.tab ?? "settings"}
            className="w-full"
          >
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
