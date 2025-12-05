/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Isso diz ao Vercel para ignorar avisos e publicar mesmo com alertas
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
