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
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/shadcn/ui",
    docs: "https://ui.shadcn.com",
  },
}
