import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  trailingSlash: true,
  allowedDevOrigins: [
    "http://192.168.1.75",
    "http://192.168.56.1",
    "http://localhost:3000",
  ],
};

export default withNextIntl(nextConfig);
