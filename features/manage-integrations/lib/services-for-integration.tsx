import { FaPlaystation, FaSteam, FaXbox } from "react-icons/fa";

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
    id: "playstation",
    name: "Playstation",
    description: "Connect your Playstation account to get your game collection",
    icon: <FaPlaystation className="text-2xl" />,
    isDisabled: true,
  },
] as const;
