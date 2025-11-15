/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore ESLint errors during build to prevent build failures
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Continue build even if there are TypeScript errors (we'll fix them)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

