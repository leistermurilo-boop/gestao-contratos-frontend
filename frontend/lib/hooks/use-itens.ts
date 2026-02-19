'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { itensService } from '@/lib/services/itens.service'
import { type ItemContratoInsert, type ItemContratoUpdate } from '@/types/models'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado'
}

export function useItens() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getByContrato = async (contratoId: string) => {
    try {
      setLoading(true)
      return await itensService.getByContrato(contratoId)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar itens:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false) // ✅ Decisão #2
    }
  }

  const getById = async (id: string) => {
    try {
      setLoading(true)
      return await itensService.getById(id)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar item:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const create = async (item: ItemContratoInsert) => {
    try {
      setLoading(true)
      const result = await itensService.create(item)
      toast.success('Item criado com sucesso!')
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao criar item:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const update = async (
    id: string,
    item: Omit<ItemContratoUpdate, 'empresa_id' | 'id' | 'contrato_id' | 'cnpj_id'>
  ) => {
    try {
      setLoading(true)
      const result = await itensService.update(id, item)
      toast.success('Item atualizado com sucesso!')
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao atualizar item:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const softDelete = async (id: string) => {
    try {
      setLoading(true)
      await itensService.softDelete(id)
      toast.success('Item removido com sucesso!')
      router.refresh()
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao remover item:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getWithMargemBaixa = async () => {
    try {
      setLoading(true)
      return await itensService.getWithMargemBaixa()
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar itens com margem baixa:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getByContrato,
    getById,
    create,
    update,
    softDelete,
    getWithMargemBaixa,
  }
}
