import { supabase } from '@/lib/supabase/client'
import {
  Apontamento,
  Cliente,
  Obra,
  Maquina,
  Funcionario,
  TipoServico,
  Abastecimento,
  Manutencao,
  Cobranca,
  Pagamento,
} from '@/types/cambui'
import {
  addOfflineQueue,
  getPendingOfflineQueue,
  markOfflineSynced,
  setCachedData,
  getCachedData,
} from '@/lib/offline-store'

// Helper to check network status
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// 1. CLIENTES
export const getClientes = async (): Promise<Cliente[]> => {
  try {
    const { data, error } = await supabase.from('clientes').select('*').order('nome')
    if (!error && data) {
      setCachedData('clientes', data)
      return data as Cliente[]
    }
  } catch (e) {
    console.warn('Network error loading clientes, falling back to cache', e)
  }
  const cached = await getCachedData<Cliente[]>('clientes')
  return cached || []
}

export const saveCliente = async (
  cliente: Partial<Cliente>,
): Promise<{ data: any; error: any }> => {
  if (cliente.id) {
    const { data, error } = await supabase
      .from('clientes')
      .update({ ...cliente, atualizado_em: new Date().toISOString() })
      .eq('id', cliente.id)
      .select()
      .single()
    return { data, error }
  } else {
    const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
    return { data, error }
  }
}

// 2. OBRAS
export const getObras = async (clienteId?: string): Promise<Obra[]> => {
  try {
    let query = supabase.from('obras').select('*, cliente:clientes(*)').order('nome')
    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    }
    const { data, error } = await query
    if (!error && data) {
      setCachedData('obras', data)
      return data as unknown as Obra[]
    }
  } catch (e) {
    console.warn('Network error loading obras', e)
  }
  const cached = await getCachedData<Obra[]>('obras')
  return cached || []
}

export const saveObra = async (obra: Partial<Obra>): Promise<{ data: any; error: any }> => {
  if (obra.id) {
    const { data, error } = await supabase
      .from('obras')
      .update({ ...obra, atualizado_em: new Date().toISOString() })
      .eq('id', obra.id)
      .select()
      .single()
    return { data, error }
  } else {
    const { data, error } = await supabase.from('obras').insert(obra).select().single()
    return { data, error }
  }
}

// 3. MAQUINAS
export const getMaquinas = async (): Promise<Maquina[]> => {
  try {
    const { data, error } = await supabase.from('maquinas').select('*').order('tipo')
    if (!error && data) {
      setCachedData('maquinas', data)
      return data as Maquina[]
    }
  } catch (e) {
    console.warn('Network error loading maquinas', e)
  }
  const cached = await getCachedData<Maquina[]>('maquinas')
  return cached || []
}

export const saveMaquina = async (
  maquina: Partial<Maquina>,
): Promise<{ data: any; error: any }> => {
  if (maquina.id) {
    const { data, error } = await supabase
      .from('maquinas')
      .update({ ...maquina, atualizado_em: new Date().toISOString() })
      .eq('id', maquina.id)
      .select()
      .single()
    return { data, error }
  } else {
    const { data, error } = await supabase.from('maquinas').insert(maquina).select().single()
    return { data, error }
  }
}

// 4. FUNCIONARIOS
export const getFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const { data, error } = await supabase.from('funcionarios').select('*').order('nome')
    if (!error && data) {
      setCachedData('funcionarios', data)
      return data as Funcionario[]
    }
  } catch (e) {
    console.warn('Network error loading funcionarios', e)
  }
  const cached = await getCachedData<Funcionario[]>('funcionarios')
  return cached || []
}

export const saveFuncionario = async (
  func: Partial<Funcionario>,
): Promise<{ data: any; error: any }> => {
  if (func.id) {
    const { data, error } = await supabase
      .from('funcionarios')
      .update({ ...func, atualizado_em: new Date().toISOString() })
      .eq('id', func.id)
      .select()
      .single()
    return { data, error }
  } else {
    const { data, error } = await supabase.from('funcionarios').insert(func).select().single()
    return { data, error }
  }
}

// 5. TIPOS DE SERVICO
export const getTiposServico = async (): Promise<TipoServico[]> => {
  try {
    const { data, error } = await supabase.from('tipos_servico').select('*').order('nome')
    if (!error && data) {
      setCachedData('tipos_servico', data)
      return data as TipoServico[]
    }
  } catch (e) {
    console.warn('Network error loading tipos_servico', e)
  }
  const cached = await getCachedData<TipoServico[]>('tipos_servico')
  return cached || []
}

export const saveTipoServico = async (servico: {
  id?: string
  nome: string
  ativo?: boolean
}): Promise<{ data: any; error: any }> => {
  if (servico.id) {
    return supabase
      .from('tipos_servico')
      .update({ nome: servico.nome, ativo: servico.ativo })
      .eq('id', servico.id)
  }
  return supabase.from('tipos_servico').insert(servico)
}

// 6. APONTAMENTOS
export const getApontamentos = async (filtros?: {
  status?: string
  funcionarioId?: string
  clienteId?: string
  dataInicio?: string
  dataFim?: string
}): Promise<Apontamento[]> => {
  let list: Apontamento[] = []

  try {
    let query = supabase
      .from('apontamentos')
      .select(`
        *,
        funcionario:funcionarios(*),
        maquina:maquinas(*),
        cliente:clientes(*),
        obra:obras(*),
        apontamento_servicos(tipo_servico:tipos_servico(*)),
        fotos(*)
      `)
      .order('data', { ascending: false })
      .order('criado_em', { ascending: false })

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }
    if (filtros?.funcionarioId) {
      query = query.eq('funcionario_id', filtros.funcionarioId)
    }
    if (filtros?.clienteId) {
      query = query.eq('cliente_id', filtros.clienteId)
    }
    if (filtros?.dataInicio) {
      query = query.gte('data', filtros.dataInicio)
    }
    if (filtros?.dataFim) {
      query = query.lte('data', filtros.dataFim)
    }

    const { data, error } = await query
    if (!error && data) {
      list = (data as any[]).map((row) => ({
        ...row,
        servicos: (row.apontamento_servicos || []).map((s: any) => s.tipo_servico).filter(Boolean),
      }))
      setCachedData('apontamentos', list)
    } else {
      const cached = await getCachedData<Apontamento[]>('apontamentos')
      list = cached || []
    }
  } catch (e) {
    console.warn('Network error fetching apontamentos', e)
    const cached = await getCachedData<Apontamento[]>('apontamentos')
    list = cached || []
  }

  // Include pending offline appointments
  const pendingOffline = await getPendingOfflineQueue()
  const offlineApontamentos = pendingOffline
    .filter((p) => p.table === 'apontamentos')
    .map((p) => ({
      ...p.data,
      is_offline: true,
      servicos: p.data.servicos || [],
    }))

  // Merge, avoiding duplicates
  const all = [
    ...offlineApontamentos,
    ...list.filter((l) => !offlineApontamentos.some((o) => o.id === l.id)),
  ]
  return all
}

// Calculate price for appointment based on custom pricing or machine default
export const resolveValorHora = async (
  clienteId: string,
  obraId: string,
  maquinaId: string,
): Promise<number> => {
  try {
    // 1. Check specific client + obra price
    const { data: precObra } = await supabase
      .from('precos_cliente')
      .select('valor_hora')
      .eq('cliente_id', clienteId)
      .eq('obra_id', obraId)
      .eq('maquina_id', maquinaId)
      .maybeSingle()

    if (precObra && precObra.valor_hora) {
      return Number(precObra.valor_hora)
    }

    // 2. Check client price (any obra)
    const { data: precCli } = await supabase
      .from('precos_cliente')
      .select('valor_hora')
      .eq('cliente_id', clienteId)
      .is('obra_id', null)
      .eq('maquina_id', maquinaId)
      .maybeSingle()

    if (precCli && precCli.valor_hora) {
      return Number(precCli.valor_hora)
    }

    // 3. Fallback to machine default
    const { data: maq } = await supabase
      .from('maquinas')
      .select('valor_hora_padrao')
      .eq('id', maquinaId)
      .maybeSingle()

    return Number(maq?.valor_hora_padrao || 0)
  } catch {
    return 0
  }
}

export const saveApontamento = async (
  apontamento: Partial<Apontamento>,
  servicoIds: string[] = [],
  fotosList: string[] = [],
): Promise<{ success: boolean; id: string; offline: boolean; error?: any }> => {
  const isNowOnline = isOnline()

  // Calculate valor_hora if not set
  let valorHora = apontamento.valor_hora_aplicado || 0
  if (!valorHora && apontamento.cliente_id && apontamento.maquina_id) {
    valorHora = await resolveValorHora(
      apontamento.cliente_id,
      apontamento.obra_id || '',
      apontamento.maquina_id,
    )
  }
  const horas = Number(apontamento.horas_trabalhadas || 0)
  const valorTotal = valorHora * horas

  const payload: any = {
    data: apontamento.data,
    funcionario_id: apontamento.funcionario_id,
    maquina_id: apontamento.maquina_id,
    cliente_id: apontamento.cliente_id,
    obra_id: apontamento.obra_id,
    horimetro_inicial: Number(apontamento.horimetro_inicial),
    horimetro_final: Number(apontamento.horimetro_final),
    horas_trabalhadas: horas,
    horas_paradas: apontamento.horas_paradas ? Number(apontamento.horas_paradas) : 0,
    motivo_parada: apontamento.motivo_parada || null,
    quantidade_viagens: apontamento.quantidade_viagens ? Number(apontamento.quantidade_viagens) : 0,
    descricao: apontamento.descricao || null,
    status: apontamento.status || 'pendente',
    motivo_devolucao: apontamento.motivo_devolucao || null,
    valor_hora_aplicado: valorHora,
    valor_total: valorTotal,
    foto_folha_url: apontamento.foto_folha_url || null,
    origem_foto: Boolean(apontamento.origem_foto),
  }

  if (!isNowOnline) {
    // Save to offline queue
    const offlineId = await addOfflineQueue('apontamentos', 'insert', {
      ...payload,
      id: `offline_${Date.now()}`,
      servico_ids: servicoIds,
      fotos_list: fotosList,
    })
    return { success: true, id: offlineId, offline: true }
  }

  try {
    let resultId = apontamento.id

    if (apontamento.id && !apontamento.id.startsWith('offline_')) {
      const { data, error } = await supabase
        .from('apontamentos')
        .update({ ...payload, atualizado_em: new Date().toISOString() })
        .eq('id', apontamento.id)
        .select()
        .single()

      if (error) throw error
      resultId = data.id
    } else {
      const { data, error } = await supabase.from('apontamentos').insert(payload).select().single()

      if (error) throw error
      resultId = data.id
    }

    // Update machine current horimeter
    if (payload.horimetro_final && payload.maquina_id) {
      await supabase
        .from('maquinas')
        .update({ horimetro_atual: payload.horimetro_final })
        .eq('id', payload.maquina_id)
    }

    // Save services links
    if (servicoIds.length > 0 && resultId) {
      await supabase.from('apontamento_servicos').delete().eq('apontamento_id', resultId)
      const servicoRows = servicoIds.map((sId) => ({
        apontamento_id: resultId,
        tipo_servico_id: sId,
      }))
      await supabase.from('apontamento_servicos').insert(servicoRows)
    }

    // Save photos
    if (fotosList.length > 0 && resultId) {
      const fotoRows = fotosList.map((url) => ({
        apontamento_id: resultId,
        url,
      }))
      await supabase.from('fotos').insert(fotoRows)
    }

    return { success: true, id: resultId!, offline: false }
  } catch (err) {
    console.warn('Failed to save online, queuing offline:', err)
    const offlineId = await addOfflineQueue('apontamentos', 'insert', {
      ...payload,
      id: `offline_${Date.now()}`,
      servico_ids: servicoIds,
      fotos_list: fotosList,
    })
    return { success: true, id: offlineId, offline: true, error: err }
  }
}

export const updateApontamentoStatus = async (
  id: string,
  status: 'aprovado' | 'devolvido' | 'pendente',
  motivoDevolucao?: string,
) => {
  return supabase
    .from('apontamentos')
    .update({
      status,
      motivo_devolucao: status === 'devolvido' ? motivoDevolucao : null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
}

// 7. ABASTECIMENTO
export const getAbastecimentos = async (): Promise<Abastecimento[]> => {
  try {
    const { data, error } = await supabase
      .from('abastecimentos')
      .select('*, maquina:maquinas(*), funcionario:funcionarios(*)')
      .order('data', { ascending: false })

    if (!error && data) {
      setCachedData('abastecimentos', data)
      return data as unknown as Abastecimento[]
    }
  } catch (e) {
    console.warn('Network error fetching abastecimentos', e)
  }
  const cached = await getCachedData<Abastecimento[]>('abastecimentos')
  return cached || []
}

export const saveAbastecimento = async (
  abast: Partial<Abastecimento>,
): Promise<{ success: boolean; id: string; offline: boolean; error?: any }> => {
  const isNowOnline = isOnline()
  const payload = {
    data: abast.data,
    maquina_id: abast.maquina_id,
    funcionario_id: abast.funcionario_id,
    horimetro_momento: Number(abast.horimetro_momento),
    tipo_combustivel: abast.tipo_combustivel || 'diesel',
    litros: Number(abast.litros),
    valor_por_litro: abast.valor_por_litro ? Number(abast.valor_por_litro) : null,
    valor_total: Number(abast.valor_total),
    posto_local: abast.posto_local || null,
    foto_cupom_url: abast.foto_cupom_url || null,
  }

  if (!isNowOnline) {
    const offlineId = await addOfflineQueue('abastecimentos', 'insert', payload)
    return { success: true, id: offlineId, offline: true }
  }

  try {
    const { data, error } = await supabase.from('abastecimentos').insert(payload).select().single()
    if (error) throw error
    return { success: true, id: data.id, offline: false }
  } catch (err) {
    const offlineId = await addOfflineQueue('abastecimentos', 'insert', payload)
    return { success: true, id: offlineId, offline: true, error: err }
  }
}

// 8. MANUTENCAO
export const getManutencoes = async (): Promise<Manutencao[]> => {
  try {
    const { data, error } = await supabase
      .from('manutencoes')
      .select('*, maquina:maquinas(*)')
      .order('data', { ascending: false })

    if (!error && data) {
      setCachedData('manutencoes', data)
      return data as unknown as Manutencao[]
    }
  } catch (e) {
    console.warn('Network error fetching manutencoes', e)
  }
  const cached = await getCachedData<Manutencao[]>('manutencoes')
  return cached || []
}

export const saveManutencao = async (
  manut: Partial<Manutencao>,
): Promise<{ success: boolean; id: string; offline: boolean; error?: any }> => {
  const isNowOnline = isOnline()
  const payload = {
    data: manut.data,
    maquina_id: manut.maquina_id,
    horimetro: Number(manut.horimetro),
    tipo: manut.tipo,
    descricao: manut.descricao,
    custo: Number(manut.custo || 0),
    oficina_responsavel: manut.oficina_responsavel || null,
    fotos: manut.fotos || [],
  }

  if (!isNowOnline) {
    const offlineId = await addOfflineQueue('manutencoes', 'insert', payload)
    return { success: true, id: offlineId, offline: true }
  }

  try {
    const { data, error } = await supabase.from('manutencoes').insert(payload).select().single()
    if (error) throw error

    // If it's oil change, update machine last oil change horimeter
    if (manut.tipo === 'troca de óleo do motor' && manut.maquina_id && manut.horimetro) {
      await supabase
        .from('maquinas')
        .update({ horimetro_ultima_troca: Number(manut.horimetro) })
        .eq('id', manut.maquina_id)
    }

    return { success: true, id: data.id, offline: false }
  } catch (err) {
    const offlineId = await addOfflineQueue('manutencoes', 'insert', payload)
    return { success: true, id: offlineId, offline: true, error: err }
  }
}

// 9. COBRANCAS & PAGAMENTOS
export const getCobrancas = async (): Promise<Cobranca[]> => {
  try {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*, cliente:clientes(*), obra:obras(*), pagamentos(*)')
      .order('criado_em', { ascending: false })

    if (!error && data) {
      return data as unknown as Cobranca[]
    }
  } catch (e) {
    console.error('Error fetching cobrancas', e)
  }
  return []
}

export const createCobranca = async (
  cobranca: Partial<Cobranca>,
  apontamentoIds: string[],
): Promise<{ success: boolean; id?: string; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('cobrancas')
      .insert({
        numero: cobranca.numero,
        cliente_id: cobranca.cliente_id,
        obra_id: cobranca.obra_id || null,
        periodo_inicio: cobranca.periodo_inicio,
        periodo_fim: cobranca.periodo_fim,
        horas_totais: cobranca.horas_totais,
        valor_total: cobranca.valor_total,
        valor_pago: 0,
        data_vencimento: cobranca.data_vencimento,
        status: 'em_aberto',
        observacoes: cobranca.observacoes || null,
      })
      .select()
      .single()

    if (error) throw error

    // Associate pointed appointments with this billing
    if (apontamentoIds.length > 0) {
      await supabase.from('apontamentos').update({ cobranca_id: data.id }).in('id', apontamentoIds)
    }

    return { success: true, id: data.id }
  } catch (e) {
    return { success: false, error: e }
  }
}

export const savePagamento = async (
  cobrancaId: string,
  pagamento: {
    valor: number
    forma_pagamento: string
    data: string
    observacao?: string
  },
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error: errPag } = await supabase.from('pagamentos').insert({
      cobranca_id: cobrancaId,
      valor: pagamento.valor,
      forma_pagamento: pagamento.forma_pagamento,
      data: pagamento.data,
      observacao: pagamento.observacao || null,
    })
    if (errPag) throw errPag

    // Recalculate billing status & total paid
    const { data: pags } = await supabase
      .from('pagamentos')
      .select('valor')
      .eq('cobranca_id', cobrancaId)

    const totalPago = (pags || []).reduce((acc, p) => acc + Number(p.valor), 0)

    const { data: cobranca } = await supabase
      .from('cobrancas')
      .select('valor_total, data_vencimento')
      .eq('id', cobrancaId)
      .single()

    if (cobranca) {
      let novoStatus: 'em_aberto' | 'pago_parcial' | 'pago' | 'atrasado' = 'em_aberto'
      const valorTotal = Number(cobranca.valor_total)
      if (totalPago >= valorTotal) {
        novoStatus = 'pago'
      } else if (totalPago > 0) {
        novoStatus = 'pago_parcial'
      } else {
        const hoje = new Date().toISOString().split('T')[0]
        if (cobranca.data_vencimento < hoje) {
          novoStatus = 'atrasado'
        }
      }

      await supabase
        .from('cobrancas')
        .update({ valor_pago: totalPago, status: novoStatus })
        .eq('id', cobrancaId)
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: e }
  }
}

// 10. BACKGROUND SYNC RUNNER
export const syncOfflineQueue = async (): Promise<{ syncedCount: number; errors: any[] }> => {
  if (!isOnline()) return { syncedCount: 0, errors: [] }

  const pending = await getPendingOfflineQueue()
  let count = 0
  const errors: any[] = []

  for (const item of pending) {
    try {
      if (item.table === 'apontamentos') {
        const { servico_ids, fotos_list, id: _tempId, ...rest } = item.data
        const { data, error } = await supabase.from('apontamentos').insert(rest).select().single()
        if (error) throw error

        if (servico_ids && servico_ids.length > 0) {
          const sRows = servico_ids.map((sId: string) => ({
            apontamento_id: data.id,
            tipo_servico_id: sId,
          }))
          await supabase.from('apontamento_servicos').insert(sRows)
        }
        if (fotos_list && fotos_list.length > 0) {
          const fRows = fotos_list.map((u: string) => ({
            apontamento_id: data.id,
            url: u,
          }))
          await supabase.from('fotos').insert(fRows)
        }
        await markOfflineSynced(item.id)
        count++
      } else if (item.table === 'abastecimentos') {
        const { id: _tempId, ...rest } = item.data
        const { error } = await supabase.from('abastecimentos').insert(rest)
        if (error) throw error
        await markOfflineSynced(item.id)
        count++
      } else if (item.table === 'manutencoes') {
        const { id: _tempId, ...rest } = item.data
        const { error } = await supabase.from('manutencoes').insert(rest)
        if (error) throw error
        await markOfflineSynced(item.id)
        count++
      }
    } catch (err) {
      console.error('Error syncing item:', item, err)
      errors.push(err)
    }
  }

  return { syncedCount: count, errors }
}
