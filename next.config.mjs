/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
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
  reactStrictMode: true,
};

export default nextConfig;
