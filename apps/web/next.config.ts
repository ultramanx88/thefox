import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withPWA from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export', // Disabled for App Hosting
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
  disable: false, // Enable PWA
  register: true,
  skipWaiting: true,
  sw: 'enhanced-sw.js', // Use our enhanced service worker
  runtimeCaching: [
    // Static assets - Cache First
    {
      urlPattern: /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets-v1',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // API responses - Network First with short TTL
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache-v1',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 3,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Images - Stale While Revalidate
    {
      urlPattern: /\.(webp|avif|png|jpg|jpeg|gif|svg)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images-v1',
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // HTML pages - Network First
    {
      urlPattern: /\.html$|\/$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-v1',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 3,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Firebase/Firestore - Network First with short TTL
    {
      urlPattern: /firestore\.googleapis\.com|firebase\.googleapis\.com/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-data-v1',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 2 * 60, // 2 minutes
        },
        networkTimeoutSeconds: 5,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Catch-all for other requests
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 3,
      },
    },
  ],
});

export default withNextIntl(withPWAConfig(nextConfig));
