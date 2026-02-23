/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hstlbkudwnboebmarilp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Todas as rotas autenticadas: proibir cache em CDN e browser intermediário.
        // O browser ainda faz cache normal (back/forward), mas Vercel CDN não irá
        // servir páginas de dashboard de um usuário para outro.
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig
