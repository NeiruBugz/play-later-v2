import { FaSteam, FaXbox } from "react-icons/fa";
import { SiEpicgames } from "react-icons/si";

export const servicesForIntegration = [
  {
    id: "steam",
    name: "Steam",
    description: "Connect your Steam account to get your game collection",
    icon: <FaSteam className="text-2xl" />,
    isDisabled: false,
  },
  {
    id: "xbox",
    name: "Xbox",
    description: "Connect your Xbox account to get your game collection",
    icon: <FaXbox className="text-2xl" />,
    isDisabled: true,
  },
  {
    id: "epic-games",
    name: "Epic Games",
    description: "Connect your Epic Games account to get your game collection",
    icon: <SiEpicgames className="text-2xl" />,
    isDisabled: true,
  },
] as const;
