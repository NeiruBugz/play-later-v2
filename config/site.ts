export const siteConfig = {
  name: "Play Later",
  description: "Your next gaming queue",
  mainNav: [
    {
      title: "Library",
      href: "/library",
    },
    {
      title: "Wishlist",
      href: "/wishlist",
    },
    {
      title: "Lists",
      href: "/lists",
    },
  ],
  links: {
    roadmap:
      "https://frosted-atlasaurus-da4.notion.site/2efccedc88084981ae6e62772d3fbcbb?v=e81099931886450692b5ec847027a146",
    discord: "https://discord.gg/NK3THJyPeT",
  },
};

export const API_URL = "https://api.igdb.com/v4";
export const IMAGE_API = "https://images.igdb.com/igdb/image/upload";

export const TOKEN_URL = `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`;

// cover_small	90 x 12
// screenshot_med	569 x 320
// cover_big	264 x 374
// logo_med	284 x 160
// screenshot_big	889 x 500
// screenshot_huge	1280 x 720
// thumb	90 x 90
// micro	35 x 35

export const IMAGE_SIZES = {
  "c-sm": "t_cover_small",
  "c-big": "t_cover_big",
  "s-md": "t_screenshot_med",
  "s-big": "t_screenshot_big",
  "s-huge": "t_screenshot_huge",
  logo: "t_logo_med",
  thumb: "t_thumb",
  micro: "t_micro",
  hd: "t_720p",
  "full-hd": "t_1080p",
};
