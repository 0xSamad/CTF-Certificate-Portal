import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "pizzip", "docxtemplater", "sharp"],
};

export default nextConfig;
