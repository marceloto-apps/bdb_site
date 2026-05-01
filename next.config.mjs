/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // Necessário para o PostHog: alguns endpoints usam trailing slash
  skipTrailingSlashRedirect: true,

  /**
   * Reverse Proxy do PostHog
   * Roteia requests através do próprio domínio para evitar bloqueio
   * por adblockers, VPNs e DNS filters.
   */
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/dashboard/backtests',
        destination: '/dashboard/backtest',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
