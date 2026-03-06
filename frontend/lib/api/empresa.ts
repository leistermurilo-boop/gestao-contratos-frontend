import { createClient } from '@/lib/supabase/client'

export async function updateMargemAlerta(
  empresaId: string,
  margemAlerta: number
): Promise<void> {
  if (margemAlerta < 0 || margemAlerta > 100) {
    throw new Error('Margem deve estar entre 0 e 100')
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('empresas')
    .update({ config_json: { margem_alerta: margemAlerta } })
    .eq('id', empresaId)

  if (error) throw error
}

export function getBadgeMargem(
  margemAtual: number | null,
  margemAlerta: number
): { className: string; label: string } | null {
  if (margemAtual === null) return null
  if (margemAtual <= 0) {
    return {
      className:
        'inline-flex items-center rounded-full border border-transparent bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground',
      label: '🔴 Erosão',
    }
  }
  if (margemAtual < margemAlerta) {
    return {
      className:
        'inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800',
      label: '⚠️ Baixa margem',
    }
  }
  return null
}
