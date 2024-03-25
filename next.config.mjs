/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "howlongtobeat.com",
      },
      {
        protocol: "https",
        hostname: "images.igdb.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/library",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
