import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : '*.supabase.co'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverActions: {
    bodySizeLimit: '10mb',
  },
  images: {
    remotePatterns: [
      {
        // Dynamic Supabase Host
        protocol: 'https',
        hostname: supabaseHost,
      },
      {
        // Fallback Supabase Wildcard Subdomain
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        // Unsplash seeded photos
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Local development environments
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
}

export default nextConfig
