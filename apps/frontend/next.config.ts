import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tampilkit-ac/api-contract'],
  async rewrites() {
    const backendPort = process.env.BACKEND_PORT || '3001';
    return [
      {
        source: '/api/v1/:path*',
        destination: `http://127.0.0.1:${backendPort}/api/v1/:path*`,
      },
      {
        source: '/api/docs/:path*',
        destination: `http://127.0.0.1:${backendPort}/api/docs/:path*`,
      },
      {
        source: '/api-json',
        destination: `http://127.0.0.1:${backendPort}/api-json`,
      },
    ];
  },
};

export default nextConfig;
