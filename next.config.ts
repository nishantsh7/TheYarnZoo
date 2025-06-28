import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
      domains: ['res.cloudinary.com'],
  },
  allowedDevOrigins: ['https://9003-firebase-studio-1749467712594.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev', 'http://localhost:9903']
};

export default nextConfig;
