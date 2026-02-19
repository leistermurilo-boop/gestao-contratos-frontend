'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { contratosService } from '@/lib/services/contratos.service'
import { type ContratoInsert, type ContratoUpdate, type FiltrosContrato } from '@/types/models'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado'
}

export function useContratos() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getAll = async () => {
    try {
      setLoading(true)
      return await contratosService.getAll()
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar contratos:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false) // ✅ Decisão #2: sempre no finally
    }
  }

  const getById = async (id: string) => {
    try {
      setLoading(true)
      return await contratosService.getById(id)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar contrato:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getWithFilters = async (filtros: FiltrosContrato) => {
    try {
      setLoading(true)
      return await contratosService.getWithFilters(filtros)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar contratos com filtros:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const create = async (contrato: ContratoInsert) => {
    try {
      setLoading(true)
      const result = await contratosService.create(contrato)
      toast.success('Contrato criado com sucesso!')
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao criar contrato:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, contrato: Omit<ContratoUpdate, 'empresa_id' | 'id'>) => {
    try {
      setLoading(true)
      const result = await contratosService.update(id, contrato)
      toast.success('Contrato atualizado com sucesso!')
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao atualizar contrato:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const softDelete = async (id: string, userId: string) => {
    try {
      setLoading(true)
      await contratosService.softDelete(id, userId)
      toast.success('Contrato arquivado com sucesso!')
      router.refresh()
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao arquivar contrato:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getExpiringSoon = async (days?: number) => {
    try {
      setLoading(true)
      return await contratosService.getExpiringSoon(days)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar contratos próximos do vencimento:', error)
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
    getWithFilters,
    create,
    update,
    softDelete,
    getExpiringSoon,
  }
}
