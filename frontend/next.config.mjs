/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure these packages are properly handled for server-side rendering
  // This is required for packages that use CommonJS or have Node.js dependencies
  serverComponentsExternalPackages: [
    'solidity-parser-antlr',
    'owasp-nest'
  ],
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
