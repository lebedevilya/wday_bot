import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // admin uploads guest reference photos straight from a phone camera (3-8MB)
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
