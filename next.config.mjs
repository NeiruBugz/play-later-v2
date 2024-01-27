/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["howlongtobeat.com"],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/library",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
