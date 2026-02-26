import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/library/", "/profile/"],
    },
    sitemap: "https://savepoint-app.vercel.app/sitemap.xml",
  };
}
