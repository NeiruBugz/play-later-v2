/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ["app", "features", "shared", "test", ".", "data-access-layer"],
  },
  serverExternalPackages: ["pino", "pino-pretty"],
  images: {
    remotePatterns: [
      {
        hostname: "howlongtobeat.com",
        protocol: "https",
      },
      {
        hostname: "images.igdb.com",
        protocol: "https",
      },
      {
        hostname: "steamcdn-a.akamaihd.net",
        protocol: "https",
      },
      {
        hostname: "avatars.steamstatic.com",
        protocol: "https",
      },
      {
        hostname: "cdn.cloudflare.steamstatic.com",
        protocol: "https",
      },
      {
        hostname: "localhost",
        protocol: "http",
      },
    ],
  },
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    reactCompiler: true,
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
