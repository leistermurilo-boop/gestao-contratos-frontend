'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, AlertCircle, XCircle, Sparkles } from 'lucide-react'
import type { OCRResult, OCRCampoExtraido } from '@/lib/agents/core/types'

// Tipo dos dados mapeados para o ContratoForm
export interface OCRPrefill {
  numero_contrato: string
  orgao_publico: string
  data_vigencia_inicio: string
  data_vigencia_fim: string
  valor_total: number | ''
  objeto: string
  cnpj_orgao: string
}

interface ConfidenceIndicatorProps {
  confidence: number
}

function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const pct = (confidence * 100).toFixed(0)
  if (confidence >= 0.9) {
    return (
      <div className="flex items-center gap-1 text-emerald-600 shrink-0">
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs font-medium">{pct}%</span>
      </div>
    )
  }
  if (confidence >= 0.7) {
    return (
      <div className="flex items-center gap-1 text-amber-600 shrink-0">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs font-medium">{pct}%</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-red-600 shrink-0">
      <XCircle className="h-4 w-4" />
      <span className="text-xs font-medium">{pct}%</span>
    </div>
  )
}

function borderByConfidence(confidence: number): string {
  if (confidence >= 0.9) return 'border-emerald-300 focus-visible:ring-emerald-400'
  if (confidence >= 0.7) return 'border-amber-300 focus-visible:ring-amber-400'
  return 'border-red-300 focus-visible:ring-red-400'
}

function getConf(campo: OCRCampoExtraido | undefined): number {
  return campo?.confidence ?? 0
}

interface OCRPreviewFormProps {
  data: OCRResult
  onConfirm: (prefill: OCRPrefill) => void
  onCancel: () => void
}

export function OCRPreviewForm({ data, onConfirm, onCancel }: OCRPreviewFormProps) {
  const c = data.campos_extraidos

  const [fields, setFields] = useState<OCRPrefill>({
    numero_contrato: (c.numero_contrato?.valor as string) ?? '',
    orgao_publico: (c.orgao_nome?.valor as string) ?? '',
    data_vigencia_inicio: (c.vigencia_inicio?.valor as string) ?? '',
    data_vigencia_fim: (c.vigencia_fim?.valor as string) ?? '',
    valor_total: (c.valor_total?.valor as number) ?? '',
    objeto: (c.objeto_contrato?.valor as string) ?? '',
    cnpj_orgao: (c.cnpj_orgao?.valor as string) ?? '',
  })

  const [confirmed, setConfirmed] = useState<boolean>(false)

  const set = (field: keyof OCRPrefill, value: string | number) => {
    setFields((prev) => ({ ...prev, [field]: value }))
  }

  const confidenceGeral = data.confidence_geral
  const totalCampos = Object.keys(c).length
  const camposAlta = Object.values(c).filter((f) => (f as OCRCampoExtraido)?.confidence >= 0.9).length

  return (
    <div className="space-y-6">
      {/* Header métricas */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Dados extraídos com IA</p>
            <p className="text-xs text-slate-600 mt-0.5">
              {camposAlta} de {totalCampos} campos com alta confiança (≥90%)
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-emerald-700">
            {(confidenceGeral * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-slate-500">precisão geral</p>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 text-xs text-slate-600 rounded-md bg-slate-50 border border-slate-200 px-4 py-2.5">
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle className="h-3.5 w-3.5" /> Alta (≥90%)
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <AlertCircle className="h-3.5 w-3.5" /> Média (70-89%)
        </span>
        <span className="flex items-center gap-1 text-red-600">
          <XCircle className="h-3.5 w-3.5" /> Baixa (&lt;70%) — revise
        </span>
      </div>

      {/* Campos */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Número do contrato */}
        <div className="space-y-1.5">
          <Label htmlFor="ocr_numero">Número do Contrato</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ocr_numero"
              value={fields.numero_contrato}
              onChange={(e) => set('numero_contrato', e.target.value)}
              className={borderByConfidence(getConf(c.numero_contrato))}
              placeholder="Ex: 001/2026"
            />
            <ConfidenceIndicator confidence={getConf(c.numero_contrato)} />
          </div>
          {getConf(c.numero_contrato) < 0.7 && (
            <p className="text-xs text-red-600">Confiança baixa — verifique</p>
          )}
        </div>

        {/* CNPJ do órgão */}
        <div className="space-y-1.5">
          <Label htmlFor="ocr_cnpj">CNPJ do Órgão</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ocr_cnpj"
              value={fields.cnpj_orgao}
              onChange={(e) => set('cnpj_orgao', e.target.value)}
              className={borderByConfidence(getConf(c.cnpj_orgao))}
              placeholder="00000000000000"
              maxLength={14}
            />
            <ConfidenceIndicator confidence={getConf(c.cnpj_orgao)} />
          </div>
        </div>

        {/* Órgão público */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ocr_orgao">Órgão Público</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ocr_orgao"
              value={fields.orgao_publico}
              onChange={(e) => set('orgao_publico', e.target.value)}
              className={borderByConfidence(getConf(c.orgao_nome))}
              placeholder="Ex: Prefeitura Municipal de..."
            />
            <ConfidenceIndicator confidence={getConf(c.orgao_nome)} />
          </div>
          {getConf(c.orgao_nome) < 0.7 && (
            <p className="text-xs text-red-600">Confiança baixa — verifique o nome do órgão</p>
          )}
        </div>

        {/* Vigência início */}
        <div className="space-y-1.5">
          <Label htmlFor="ocr_inicio">Início da Vigência</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ocr_inicio"
              type="date"
              value={fields.data_vigencia_inicio}
              onChange={(e) => set('data_vigencia_inicio', e.target.value)}
              className={borderByConfidence(getConf(c.vigencia_inicio))}
            />
            <ConfidenceIndicator confidence={getConf(c.vigencia_inicio)} />
          </div>
        </div>

        {/* Vigência fim */}
        <div className="space-y-1.5">
          <Label htmlFor="ocr_fim">Fim da Vigência</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ocr_fim"
              type="date"
              value={fields.data_vigencia_fim}
              onChange={(e) => set('data_vigencia_fim', e.target.value)}
              className={borderByConfidence(getConf(c.vigencia_fim))}
            />
            <ConfidenceIndicator confidence={getConf(c.vigencia_fim)} />
          </div>
        </div>

        {/* Valor total */}
        <div className="space-y-1.5">
          <Label htmlFor="ocr_valor">Valor Total (R$)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ocr_valor"
              type="number"
              step="0.01"
              min="0"
              value={fields.valor_total}
              onChange={(e) => set('valor_total', parseFloat(e.target.value) || '')}
              className={borderByConfidence(getConf(c.valor_total))}
              placeholder="0,00"
            />
            <ConfidenceIndicator confidence={getConf(c.valor_total)} />
          </div>
          {getConf(c.valor_total) < 0.7 && (
            <p className="text-xs text-red-600">Confiança baixa — REVISE o valor</p>
          )}
        </div>

        {/* Objeto */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ocr_objeto">Objeto do Contrato</Label>
          <div className="flex items-start gap-2">
            <Textarea
              id="ocr_objeto"
              value={fields.objeto}
              onChange={(e) => set('objeto', e.target.value)}
              rows={3}
              className={borderByConfidence(getConf(c.objeto_contrato))}
              placeholder="Descrição do objeto..."
            />
            <ConfidenceIndicator confidence={getConf(c.objeto_contrato)} />
          </div>
        </div>
      </div>

      {/* Checkbox confirmação */}
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <Checkbox
          id="ocr_confirm"
          checked={confirmed}
          onCheckedChange={(v) => setConfirmed(Boolean(v))}
        />
        <label htmlFor="ocr_confirm" className="text-sm text-slate-700 cursor-pointer select-none">
          Revisei os dados acima e confirmo que estão corretos
        </label>
      </div>

      {/* Ações */}
      <div className="flex justify-between border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Preencher Manualmente
          </Button>
          <Button
            onClick={() => onConfirm(fields)}
            disabled={!confirmed}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            Usar estes dados →
          </Button>
        </div>
      </div>
    </div>
  )
}
