import { revalidatePath } from "next/cache";

import { servicesForIntegration } from "../lib/services-for-integration";
import { getSteamUserData } from "../server-actions/get-steam-user-data";
import { removeSteamDataFromUser } from "../server-actions/remove-steam-data-from-user";
import { ServiceIntegration } from "./service-integration";

export async function IntegrationsList() {
  const user = await getSteamUserData();

  const handleSteamDisconnect = async () => {
    "use server";

    await removeSteamDataFromUser();
    revalidatePath("/user/settings");
  };

  if (!user) {
    return null;
  }

  const { data: userData } = user;

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
