import { revalidatePath } from "next/cache";

import { UserService } from "@/shared/services/user";

import { servicesForIntegration } from "../lib/services-for-integration";
import { ServiceIntegration } from "./service-integration";

export async function IntegrationsList() {
  const userService = new UserService();
  const userResult = await userService.getSteamUserData();

  const handleSteamDisconnect = async () => {
    "use server";

    const userService = new UserService();
    await userService.disconnectSteam();
    revalidatePath("/user/settings");
  };

  if (!userResult.success || !userResult.data) {
    return null;
  }

  const userData = userResult.data;

  return (
    <div className="flex flex-col gap-4">
      {servicesForIntegration.map((service) => {
        const isConnected = service.id === "steam" && !!userData?.steamId64;

        return (
          <ServiceIntegration
            key={service.id}
            {...service}
            isConnected={isConnected}
            connectedUsername={
              userData?.steamUsername && service.id === "steam"
                ? userData?.steamUsername
                : undefined
            }
            profileUrl={
              userData?.steamProfileURL && service.id === "steam"
                ? userData?.steamProfileURL
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
