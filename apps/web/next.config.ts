import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withPWA from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export', // Temporarily disabled for dynamic routes
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  disable: true, // Disable PWA for now to fix build issues
  register: false,
  skipWaiting: false,
});

export default withNextIntl(withPWAConfig(nextConfig));
