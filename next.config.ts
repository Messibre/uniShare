import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  async redirects() {
    return [
      {
        source: "/api/:path((?!v1/).*)",
        destination: "/api/v1/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
