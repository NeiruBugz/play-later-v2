export const PRODUCT_NAME = "Continue?";
export const PRODUCT_NAME_PLAIN = "Continue";
export const PRODUCT_TAGLINE =
  "Your games and the things you've thought about them.";
export const PRODUCT_DESCRIPTION =
  "A library, not a backlog. Curate your library across every platform and journal what made each game matter.";
export const OG_IMAGE_PATH = "/og-image.png";
export const MANIFEST_PATH = "/manifest.json";

export const THEME_COLORS = {
  light: "#f6f1e7",
  dark: "#120f0c",
} as const;

export function pageTitle(part?: string): string {
  return part ? `${part} · ${PRODUCT_NAME}` : PRODUCT_NAME;
}

export function socialMeta({
  siteOrigin,
  pathname,
  title,
}: {
  siteOrigin: string;
  pathname?: string;
  title?: string;
}) {
  const fullTitle = pageTitle(title);
  const imageUrl = `${siteOrigin}${OG_IMAGE_PATH}`;
  return [
    { title: fullTitle },
    { name: "description", content: PRODUCT_DESCRIPTION },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: PRODUCT_DESCRIPTION },
    { property: "og:type", content: "website" },
    ...(pathname === undefined
      ? []
      : [{ property: "og:url", content: `${siteOrigin}${pathname}` }]),
    { property: "og:image", content: imageUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: PRODUCT_DESCRIPTION },
    { name: "twitter:image", content: imageUrl },
  ];
}

export function buildManifest() {
  return {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
    icons: [
      {
        src: "/favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon",
      },
      { src: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      {
        src: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
    start_url: "/",
    display: "standalone",
    theme_color: THEME_COLORS.light,
    background_color: THEME_COLORS.light,
  };
}
