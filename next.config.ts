import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
const minioProxyTarget = (
  process.env.MINIO_PROXY_TARGET ?? "http://49.213.52.38:9000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Allow LAN / phone access to Next.js HMR and other /_next dev assets.
  // `*.*.*.*` matches any IPv4 hostname (e.g. 192.168.0.165).
  allowedDevOrigins: ["*.*.*.*", "localhost", "127.0.0.1"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        // Proxy MinIO over the HTTPS frontend origin to avoid mixed-content blocks.
        source: "/minio/:path*",
        destination: `${minioProxyTarget}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "49.213.52.38",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tailwindcss.com",
        pathname: "/plus-assets/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
