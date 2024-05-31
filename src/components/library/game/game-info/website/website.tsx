import Link from "next/link";
import {
  FaAppStore,
  FaDiscord,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaReddit,
  FaSteam,
  FaTwitch,
  FaTwitter,
  FaWikipediaW,
  FaYoutube,
} from "react-icons/fa6";
import { SiEpicgames, SiFandom } from "react-icons/si";
import { Button } from "@/src/shared/ui/button";
import { Icons } from "@/src/components/icons";

function SiteIcon({ siteName }: { siteName: string }) {
  if (siteName.includes("twitch")) {
    return <FaTwitch />;
  }
  if (siteName.includes("discord")) {
    return <FaDiscord />;
  }
  if (siteName.includes("fandom")) {
    return <SiFandom />;
  }
  if (siteName.includes("epic")) {
    return <SiEpicgames />;
  }
  if (siteName.includes("reddit")) {
    return <FaReddit />;
  }
  if (siteName.includes("youtube")) {
    return <FaYoutube />;
  }
  if (siteName.includes("facebook")) {
    return <FaFacebook />;
  }
  if (siteName.includes("twitter")) {
    return <FaTwitter />;
  }
  if (siteName.includes("wikipedia") || siteName.includes("wiki")) {
    return <FaWikipediaW />;
  }
  if (siteName.includes("instagram")) {
    return <FaInstagram />;
  }
  if (siteName.includes("steam")) {
    return <FaSteam />;
  }
  if (siteName.includes("gog.com")) {
    return <Icons.gog />;
  }
  if (siteName.includes("apple")) {
    return <FaAppStore />;
  }
  return <FaGlobe />;
}

function SiteLabel({ siteName }: { siteName: string }) {
  if (siteName.includes("twitch")) {
    return <span>Twitch</span>;
  }
  if (siteName.includes("discord")) {
    return <span>Discord</span>;
  }
  if (siteName.includes("fandom")) {
    return <span>Fandom</span>;
  }
  if (siteName.includes("epic")) {
    return <span>Epic Games</span>;
  }
  if (siteName.includes("reddit")) {
    return <span>Reddit</span>;
  }
  if (siteName.includes("youtube")) {
    return <span>Youtube</span>;
  }
  if (siteName.includes("facebook")) {
    return <span>Facebook</span>;
  }
  if (siteName.includes("twitter")) {
    return <span>Twitter</span>;
  }
  if (siteName.includes("wikipedia")) {
    return <span>Wikipedia</span>;
  }
  if (siteName.includes("wiki")) {
    return <span>Fan Wiki</span>;
  }
  if (siteName.includes("instagram")) {
    return <span>Instagram</span>;
  }
  if (siteName.includes("steam")) {
    return <span>Steam</span>;
  }
  if (siteName.includes("gog.com")) {
    return <span>GOG.com</span>;
  }
  if (siteName.includes("fextralife")) {
    return <span>Fextralife</span>;
  }
  if (siteName.includes("apple")) {
    return <span>Apple App Store</span>;
  }

  return <span>Official web-site</span>;
}

export const Website = ({ url }: { url: string }) => (
  <Button className="justify-start" variant="link">
    <Link
      className="flex max-w-[160px] items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
      href={url}
      target="_blank"
    >
      <SiteIcon siteName={url} />
      <SiteLabel siteName={url} />
    </Link>
  </Button>
);
