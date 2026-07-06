import type { NextConfig } from "next";

const replitDomains = [
  process.env.REPLIT_DEV_DOMAIN,
  ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",") : []),
].filter((domain): domain is string => Boolean(domain));

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...replitDomains,
    "*.replit.dev",
    "*.repl.co",
    "*.spock.replit.dev",
  ],
};

export default nextConfig;
