'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateMargemAlerta } from '@/lib/api/empresa'
import { useEmpresa } from '@/contexts/empresa-context'
import toast from 'react-hot-toast'

interface ConfigMargemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfigMargemModal({ open, onOpenChange }: ConfigMargemModalProps) {
  const { empresa, margemAlerta, refreshEmpresa } = useEmpresa()
  const [margem, setMargem] = useState(margemAlerta)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!empresa) return

    setLoading(true)
    try {
      await updateMargemAlerta(empresa.id, margem)
      await refreshEmpresa()
      toast.success('Margem de alerta atualizada!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao salvar configuração')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Margem de Alerta</DialogTitle>
          <DialogDescription>
            Defina o percentual mínimo de margem. Contratos abaixo deste valor receberão badge de alerta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="margem">Margem Mínima (%)</Label>
            <Input
              id="margem"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={margem}
              onChange={(e) => setMargem(parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-slate-500">
              Sistema alertará quando margem estiver abaixo de {margem}%
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">
              💡 <strong>Preview:</strong> Contratos com margem inferior a {margem}% receberão
              badge de alerta amarelo. Contratos com margem ≤ 0% recebem badge vermelho de erosão.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
