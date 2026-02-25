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
        // Rotas autenticadas: proibir cache em CDN/proxy — nunca servir página de
        // um usuário para outro. O middleware deve sempre executar nessas rotas.
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        // Rotas de autenticação: também sem cache para garantir que o middleware
        // execute e possa redirecionar usuários já autenticados para /dashboard.
        // Sem isso, edge CDN pode servir /login cacheado e ignorar o redirect.
        source: '/(login|cadastro|recuperar-senha|callback)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig
