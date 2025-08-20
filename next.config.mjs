/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'features', 'shared', 'test', '.'], // Include all relevant directories and root
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
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
      {
        hostname: "steamcdn-a.akamaihd.net",
        protocol: "https",
      },
    ],
    unoptimized: true,
  },
  reactStrictMode: true,
  typedRoutes: true,
};

export default nextConfig;
