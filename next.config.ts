import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  async redirects() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/v1/:path*",
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
