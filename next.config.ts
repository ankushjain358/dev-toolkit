import type { NextConfig } from "next";
import outputs from "./amplify_outputs.json";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: outputs.custom.distributionDomainName,
      },
    ],
  },
};

export default nextConfig;
