/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["howlongtobeat.com"]
  },
  experimental: {
    appDir: true,
  },
}

export default nextConfig
