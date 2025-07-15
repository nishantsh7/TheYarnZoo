import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['entities'],
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
  allowedDevOrigins: ['https://9003-firebase-studio-1749467712594.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev', 'http://localhost:9903'],

  // --- Add this webpack configuration ---
  webpack: (config, { isServer }) => {
    if (isServer) {
      // These modules are typically Node.js specific or server-side only.
      // We instruct Webpack to treat them as external when bundling for the server.
      // They won't be included in the client bundle at all, which is usually desired for these types of dependencies.
      Object.assign(config.externals, {
        handlebars: 'commonjs handlebars',
        dotprompt: 'commonjs dotprompt', // dotprompt uses handlebars
        '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger',
        '@opentelemetry/winston-transport': 'commonjs @opentelemetry/winston-transport',
        '@genkit-ai/firebase': 'commonjs @genkit-ai/firebase',
        // If you encounter other similar "Module not found" or `require.extensions` warnings
        // for modules related to tracing, logging, or GenKit, add them here.
        // Example: '@opentelemetry/sdk-node': 'commonjs @opentelemetry/sdk-node',
      });
    }
    return config;
  },
  // --- End of webpack configuration ---
};

export default nextConfig;