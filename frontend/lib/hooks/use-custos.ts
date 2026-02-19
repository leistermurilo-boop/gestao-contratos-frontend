'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { custosService, type FiltrosCusto } from '@/lib/services/custos.service'
import { canViewCosts } from '@/lib/constants/perfis'
import { type CustoItemInsert } from '@/types/models'
import toast from 'react-hot-toast'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado'
}

export function useCustos() {
  const [loading, setLoading] = useState(false)
  const { usuario } = useAuth()

  // ⚠️ CRÍTICO: Perfil logística NÃO acessa custos (Decisão #6 — RLS + verificação de ativo)
  const canAccess = usuario ? canViewCosts(usuario.perfil) : false

  const getByItem = async (itemId: string) => {
    if (!canAccess) {
      throw new Error('Perfil não autorizado a visualizar custos')
    }

    try {
      setLoading(true)
      return await custosService.getByItem(itemId)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar custos:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false) // ✅ Decisão #2
    }
  }

  const getAll = async (filtros?: FiltrosCusto) => {
    if (!canAccess) {
      throw new Error('Perfil não autorizado a visualizar custos')
    }

    try {
      setLoading(true)
      return await custosService.getAll(filtros)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar custos:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const create = async (custo: CustoItemInsert) => {
    if (!canAccess) {
      throw new Error('Perfil não autorizado a registrar custos')
    }

    try {
      setLoading(true)
      const result = await custosService.create(custo)
      toast.success('Custo registrado com sucesso!')
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao registrar custo:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getUltimoCusto = async (itemId: string) => {
    if (!canAccess) {
      throw new Error('Perfil não autorizado a visualizar custos')
    }

    try {
      setLoading(true)
      return await custosService.getUltimoCusto(itemId)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Erro ao buscar último custo:', error)
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    canAccess, // Expor para componentes verificarem antes de renderizar
    getByItem,
    getAll,
    create,
    getUltimoCusto,
  }
}
