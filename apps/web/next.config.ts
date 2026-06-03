import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? 'http://localhost:4000';
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${backend}/:path*`,
      },
    ];
  },
};

export default nextConfig;
