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
    const origins = process.env.NODE_ENV === 'production'
      ? ['https://poker-planning-next.vercel.app']
      : ['http://localhost:3000']

    return [
      {
        source: '/socket.io/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: origins.join(',') },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'content-type' },
        ],
      },
    ]
  },
}

module.exports = nextConfig 