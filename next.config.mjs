/** @type {import('next').NextConfig} */
const nextConfig = {
  // typedRoutes: enable later — most links are computed from vault paths
  // at runtime, so the strict-Link checks add noise without much safety.
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
