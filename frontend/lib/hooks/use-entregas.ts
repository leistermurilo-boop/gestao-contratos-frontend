'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { entregasService, type FiltrosEntrega } from '@/lib/services/entregas.service'
import { type EntregaInsert } from '@/types/models'
import toast from 'react-hot-toast'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado'
}

export function useEntregas() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getAll = async (filtros?: FiltrosEntrega) => {
    try {
      setLoading(true)
      return await entregasService.getAll(filtros)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar entregas:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false) // ✅ Decisão #2: sempre no finally
    }
  }

  const getById = async (id: string) => {
    try {
      setLoading(true)
      return await entregasService.getById(id)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar entrega:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getByAF = async (afId: string) => {
    try {
      setLoading(true)
      return await entregasService.getByAF(afId)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar entregas da AF:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const validateSaldoAF = async (afId: string, quantidade: number) => {
    try {
      return await entregasService.validateSaldoAF(afId, quantidade)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao validar saldo da AF:', error)
      toast.error(message)
      throw error
    }
  }

  const create = async (entrega: EntregaInsert) => {
    try {
      setLoading(true)
      const result = await entregasService.create(entrega)
      toast.success('Entrega registrada com sucesso!')
      router.refresh() // Atualizar saldos na UI após trigger do backend
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao registrar entrega:', error)
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
    getByAF,
    validateSaldoAF,
    create,
  }
}
