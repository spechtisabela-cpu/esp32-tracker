/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This forces Vercel to ignore warnings and publish anyway
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
