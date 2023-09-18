export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Play Later",
  description:
    "Beautifully designed components built with Radix UI and Tailwind CSS.",
  mainNav: [
    {
      title: "Library",
      href: "/library",
    },
    {
      title: "Search",
      href: "/search",
    },
    {
      title: "Wishlist",
      href: "/wishlist",
    },
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/shadcn/ui",
    docs: "https://ui.shadcn.com",
  },
}
