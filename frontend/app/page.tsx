import { redirect } from 'next/navigation'

/**
 * Rota raiz — redireciona sempre para /dashboard.
 * O middleware cuida do resto:
 *   - Não autenticado → /dashboard → middleware → /login
 *   - Autenticado     → /dashboard → middleware → deixa passar
 */
export default function Home() {
  redirect('/dashboard')
}
