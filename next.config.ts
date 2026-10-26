import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.178.24", "localhost", "127.0.0.1"],
  webpack: (config, { dev }) => {
    if (dev) {
      // Verhindert Datei-Locks und defekte Vendor-Chunks durch OneDrive-Synchronisierung im Dev-Modus
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
