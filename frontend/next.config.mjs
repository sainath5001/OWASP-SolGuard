/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure these packages are properly handled for server-side rendering
  // This is required for packages that use CommonJS or have Node.js dependencies
  serverComponentsExternalPackages: [
    'solidity-parser-antlr',
    'owasp-nest'
  ]
};

export default nextConfig;

