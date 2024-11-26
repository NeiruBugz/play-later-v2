/** @type {import("next").NextConfig} */
const nextConfig = {
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
    ],
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
