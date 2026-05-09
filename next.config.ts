import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable static optimization for images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.storage.zexfa.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Proxy API requests to Go backend
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

    return [
      // Portfolio items (Go backend)
      {
        source: '/api/portfolio-items/:path*',
        destination: `${backendUrl}/api/portfolio-items/:path*`,
      },
      // Blog posts (Go backend)
      {
        source: '/api/blog-posts/:path*',
        destination: `${backendUrl}/api/blog-posts/:path*`,
      },
      // Admin portfolio items (Go backend)
      {
        source: '/api/admin/portfolio-items/:path*',
        destination: `${backendUrl}/api/admin/portfolio-items/:path*`,
      },
      // Admin blog posts (Go backend)
      {
        source: '/api/admin/blog-posts/:path*',
        destination: `${backendUrl}/api/admin/blog-posts/:path*`,
      },
      // Admin database utilities (Go backend)
      {
        source: '/api/admin/db/:path*',
        destination: `${backendUrl}/api/admin/db/:path*`,
      },
      // Admin health check (Go backend)
      {
        source: '/api/admin/health',
        destination: `${backendUrl}/api/admin/health`,
      },
    ];
  },

  // Headers for caching static assets
  async headers() {
    // IMPORTANT:
    // In development, Next.js chunk filenames are not content-hashed.
    // Setting `immutable` caching for `*.js`/`*.css` will frequently cause
    // ChunkLoadError / hydration weirdness due to stale cached bundles.
    if (process.env.NODE_ENV !== 'production') return [];

    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
