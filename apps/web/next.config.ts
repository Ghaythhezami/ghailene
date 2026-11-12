import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
if (process.env.NODE_ENV === "production" && (!apiUrl || !/^https?:\/\//.test(apiUrl))) {
  throw new Error("Set NEXT_PUBLIC_API_URL to the absolute backend API URL before building for production.");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async rewrites() {
    return apiUrl && /^https?:\/\//.test(apiUrl)
      ? [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }]
      : [];
  },
};

export default nextConfig;
