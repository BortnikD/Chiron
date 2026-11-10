import type { NextConfig } from "next";

const apiProxyTarget = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_PROXY_TARGET ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_PROXY_TARGET: apiProxyTarget,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
      {
        source: "/actuator/:path*",
        destination: `${apiProxyTarget}/actuator/:path*`,
      },
    ];
  },
};

export default nextConfig;
