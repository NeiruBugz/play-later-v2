export type SiteConfig = typeof siteConfig;

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
