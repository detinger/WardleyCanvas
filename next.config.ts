import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Lets E2E runs use their own build dir alongside a running dev server
  distDir: process.env.NEXT_DIST_DIR || '.next',
    devIndicators: {
    appIsrStatus: false,
    },
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
