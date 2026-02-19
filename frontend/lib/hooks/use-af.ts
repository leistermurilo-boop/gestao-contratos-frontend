'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { afService, type FiltrosAF } from '@/lib/services/af.service'
import {
  type AutorizacaoFornecimentoInsert,
  type AutorizacaoFornecimentoUpdate,
} from '@/types/models'
import toast from 'react-hot-toast'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado'
}

export function useAF() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getAll = async (filtros?: FiltrosAF) => {
    try {
      setLoading(true)
      return await afService.getAll(filtros)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar AFs:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false) // ✅ Decisão #2
    }
  }

  const getById = async (id: string) => {
    try {
      setLoading(true)
      return await afService.getById(id)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar AF:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const validateSaldo = async (itemId: string, quantidade: number) => {
    try {
      return await afService.validateSaldo(itemId, quantidade)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao validar saldo:', error)
      toast.error(message)
      throw error
    }
  }

  const create = async (af: AutorizacaoFornecimentoInsert) => {
    try {
      setLoading(true)
      const result = await afService.create(af)
      toast.success('AF emitida com sucesso!')
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao emitir AF:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const update = async (
    id: string,
    af: Omit<AutorizacaoFornecimentoUpdate, 'empresa_id' | 'id' | 'contrato_id' | 'item_id'>
  ) => {
    try {
      setLoading(true)
      const result = await afService.update(id, af)
      toast.success('AF atualizada com sucesso!')
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao atualizar AF:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getPendentes = async () => {
    try {
      setLoading(true)
      return await afService.getPendentes()
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar AFs pendentes:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getAll,
    getById,
    validateSaldo,
    create,
    update,
    getPendentes,
  }
}
