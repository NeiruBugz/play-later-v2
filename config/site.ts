export type SiteConfig = typeof siteConfig

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
      title: "Search",
      href: "/search",
    },
    {
      title: "Lists",
      href: "/lists",
    },
    {
      title: "Discord Server",
      href: "https://discord.gg/NK3THJyPeT",
      external: true,
    },
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/shadcn/ui",
    docs: "https://ui.shadcn.com",
  },
}
