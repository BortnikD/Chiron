import type { NextConfig } from "next";

const apiProxyTarget = (
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_PROXY_TARGET ||
    "http://localhost:8080"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Разрешаем Next.js работать через домены туннелей (ngrok, trycloudflare.com, lhr.life)
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "://trycloudflare.com",
    "*.lhr.life",
    "*.localhost.run",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.ngrok-free.app",
        "*.ngrok.app",
        "*.ngrok.io",
        "*.trycloudflare.com",
        "://trycloudflare.com",
        "*.lhr.life",
        "*.localhost.run",
      ],
    },
  },
  env: {
    NEXT_PUBLIC_API_PROXY_TARGET: apiProxyTarget,
  },
  async rewrites() {
    return [
      {
        source: "/actuator/:path*",
        destination: `${apiProxyTarget}/actuator/:path*`,
      },
    ];
  },
};

export default nextConfig;
