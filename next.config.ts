import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "pizzip", "docxtemplater"],
};

export default nextConfig;
