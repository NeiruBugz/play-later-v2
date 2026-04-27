/** @type {import("next").NextConfig} */
const nextConfig = {
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
      {
        hostname: "authjs.dev",
        protocol: "https",
      }
    ],
  },
  reactStrictMode: true,
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    viewTransition: true,
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
