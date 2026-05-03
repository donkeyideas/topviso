import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@aso/db', '@aso/types'],
  serverExternalPackages: ['google-play-scraper'],
}

export default nextConfig
