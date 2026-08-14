import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
