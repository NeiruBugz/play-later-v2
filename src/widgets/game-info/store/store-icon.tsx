import {
  SiAmazon,
  SiEpicgames,
  SiPlaystation,
  SiSteam,
  SiXbox,
} from "react-icons/si";

export const StoreIcon = ({ storeName }: { storeName: string }) => {
  if (storeName.includes("steam")) {
    return <SiSteam />;
  }

  if (storeName.includes("epic")) {
    return <SiEpicgames />;
  }
  if (storeName.includes("playstation")) {
    return <SiPlaystation />;
  }
  if (storeName.includes("amazon")) {
    return <SiAmazon />;
  }
  if (storeName.includes("microsoft")) {
    return <SiXbox />;
  }
  return <></>;
};
