/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
  async headers() {
    const origin = process.env.NODE_ENV === 'production'
      ? 'https://poker-planning-next.vercel.app'
      : 'http://localhost:3000'

    return [
      {
        source: '/api/socket',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: origin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'content-type' },
        ],
      },
    ]
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    PROJECT_ROOT: __dirname,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig 