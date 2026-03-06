'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigMargemModal } from './config-margem-modal'

export function ContratosAlertConfig() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Settings className="mr-2 h-4 w-4" />
        Configurar Alerta
      </Button>
      <ConfigMargemModal open={open} onOpenChange={setOpen} />
    </>
  )
}
