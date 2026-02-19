'use client'

import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-slate-200">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {Icon && <Icon className="mb-4 h-12 w-12 text-slate-400" />}
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-6 bg-brand-navy hover:bg-brand-navy/90">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
