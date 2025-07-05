import { getServerUserId } from "@/auth";
import { revalidatePath } from "next/cache";

import { prisma } from "@/shared/lib/db";

import { servicesForIntegration } from "../lib/services-for-integration";
import { ServiceIntegration } from "./service-integration";

export async function IntegrationsList() {
  const userId = await getServerUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      steamId64: true,
      steamUsername: true,
      steamProfileURL: true,
      steamConnectedAt: true,
    },
  });

  const handleSteamDisconnect = async () => {
    "use server";

    try {
      const userId = await getServerUserId();
      if (!userId) {
        throw new Error("Unauthorized");
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          steamId64: null,
          steamUsername: null,
          steamProfileURL: null,
          steamAvatar: null,
          steamConnectedAt: null,
        },
      });

      revalidatePath("/user/settings");
    } catch (error) {
      console.error("Steam disconnect error:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {servicesForIntegration.map((service) => {
        const isConnected = service.id === "steam" && !!user?.steamId64;

        return (
          <ServiceIntegration
            key={service.id}
            {...service}
            isConnected={isConnected}
            connectedUsername={
              user?.steamUsername && service.id === "steam"
                ? user?.steamUsername
                : undefined
            }
            profileUrl={
              user?.steamProfileURL && service.id === "steam"
                ? user?.steamProfileURL
                : undefined
            }
            onDisconnect={
              service.id === "steam" ? handleSteamDisconnect : undefined
            }
          />
        );
      })}
    </div>
  );
}
