'use client'

import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          className="flex-shrink-0 bg-brand-navy hover:bg-brand-navy/90"
        >
          {action.icon && (() => {
            // Atribuição a variável uppercase necessária para JSX (Decisão #11)
            const ActionIcon = action.icon!
            return <ActionIcon className="mr-2 h-4 w-4" />
          })()}
          {action.label}
        </Button>
      )}
    </div>
  )
}
