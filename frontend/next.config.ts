import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",
  basePath: "/eCommerce",
  assetPrefix: "/eCommerce/",
  trailingSlash: true,
  allowedDevOrigins: [
    "http://192.168.1.75",
    "http://192.168.56.1",
    "http://localhost:3000",
  ],
};

export default nextConfig;
