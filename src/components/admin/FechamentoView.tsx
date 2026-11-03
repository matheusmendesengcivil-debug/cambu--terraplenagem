import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DollarSign,
  FileText,
  Share2,
  Printer,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  CreditCard,
  Send,
} from 'lucide-react'
import {
  getClientes,
  getObras,
  getApontamentos,
  getCobrancas,
  createCobranca,
  savePagamento,
} from '@/services/cambui'
import { Cliente, Obra, Apontamento, Cobranca } from '@/types/cambui'
import { formatCurrency, formatHoursShort, formatDateBR } from '@/lib/formatters'
import { toast } from 'sonner'

export const FechamentoView: React.FC = () => {
  const [aba, setAba] = useState<'nova_medicao' | 'cobrancas_emitidas'>('cobrancas_emitidas')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [apontamentosAprovados, setApontamentosAprovados] = useState<Apontamento[]>([])

  // Selection for new closing
  const [clienteId, setClienteId] = useState('')
  const [obraId, setObraId] = useState('')
  const hoje = new Date().toISOString().split('T')[0]
  const [periodoInicio, setPeriodoInicio] = useState(hoje)
  const [periodoFim, setPeriodoFim] = useState(hoje)
  const [vencimento, setVencimento] = useState(hoje)
  const [selecionadosIds, setSelecionadosIds] = useState<string[]>([])
  const [gerando, setGerando] = useState(false)

  // Modal registrar pagamento
  const [modalPagamento, setModalPagamento] = useState<Cobranca | null>(null)
  const [valorPagamento, setValorPagamento] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<string>('Pix')
  const [obsPagamento, setObsPagamento] = useState('')

  // Modal visualizar / imprimir relatório de medição
  const [cobrancaRelatorio, setCobrancaRelatorio] = useState<Cobranca | null>(null)

  const carregarTudo = async () => {
    const [clis, obs, cobs, aps] = await Promise.all([
      getClientes(),
      getObras(),
      getCobrancas(),
      getApontamentos({ status: 'aprovado' }),
    ])
    setClientes(clis)
    setObras(obs)
    setCobrancas(cobs)

    // Only unbilled approved appointments
    const naoFaturados = aps.filter((a) => !a.cobranca_id)
    setApontamentosAprovados(naoFaturados)
    if (clis.length > 0 && !clienteId) {
      setClienteId(clis[0].id)
    }
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  // Filter available appointments for selected client
  const apontamentosDoCliente = apontamentosAprovados.filter((a) => {
    if (clienteId && a.cliente_id !== clienteId) return false
    if (obraId && a.obra_id !== obraId) return false
    return true
  })

  const toggleApontamento = (id: string) => {
    if (selecionadosIds.includes(id)) {
      setSelecionadosIds(selecionadosIds.filter((x) => x !== id))
    } else {
      setSelecionadosIds([...selecionadosIds, id])
    }
  }

  const selecionarTodos = () => {
    if (selecionadosIds.length === apontamentosDoCliente.length) {
      setSelecionadosIds([])
    } else {
      setSelecionadosIds(apontamentosDoCliente.map((a) => a.id))
    }
  }

  // Sums of selected appointments
  const totalHorasSel = apontamentosDoCliente
    .filter((a) => selecionadosIds.includes(a.id))
    .reduce((acc, a) => acc + Number(a.horas_trabalhadas || 0), 0)

  const totalValorSel = apontamentosDoCliente
    .filter((a) => selecionadosIds.includes(a.id))
    .reduce((acc, a) => acc + Number(a.valor_total || 0), 0)

  // Generate closing / billing
  const handleGerarMedicao = async () => {
    if (!clienteId) {
      toast.error('Selecione o cliente.')
      return
    }
    if (selecionadosIds.length === 0) {
      toast.error('Selecione ao menos um apontamento aprovado para faturar.')
      return
    }

    setGerando(true)
    try {
      const numeroMedicao = `MED-${new Date().getFullYear()}-${(cobrancas.length + 1).toString().padStart(3, '0')}`
      const res = await createCobranca(
        {
          numero: numeroMedicao,
          cliente_id: clienteId,
          obra_id: obraId || null,
          periodo_inicio: periodoInicio,
          periodo_fim: periodoFim,
          horas_totais: Number(totalHorasSel.toFixed(1)),
          valor_total: totalValorSel,
          data_vencimento: vencimento,
          observacoes: `Medição de serviços de terraplenagem gerada em ${formatDateBR(hoje)}.`,
        },
        selecionadosIds,
      )

      if (res.success) {
        toast.success(`Cobrança / Medição ${numeroMedicao} gerada com sucesso!`)
        setSelecionadosIds([])
        await carregarTudo()
        setAba('cobrancas_emitidas')
      } else {
        throw res.error
      }
    } catch (err: any) {
      toast.error('Erro ao gerar medição: ' + (err.message || 'Tente novamente'))
    } finally {
      setGerando(false)
    }
  }

  // Register payment
  const handleConfirmarPagamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalPagamento) return
    const v = parseFloat(valorPagamento) || 0
    if (v <= 0) {
      toast.error('Informe um valor de pagamento válido.')
      return
    }

    try {
      const res = await savePagamento(modalPagamento.id, {
        valor: v,
        forma_pagamento: formaPagamento,
        data: hoje,
        observacao: obsPagamento,
      })

      if (res.success) {
        toast.success('Pagamento registrado com sucesso!')
        setModalPagamento(null)
        setValorPagamento('')
        setObsPagamento('')
        await carregarTudo()
      } else {
        throw res.error
      }
    } catch (err: any) {
      toast.error('Erro ao registrar pagamento: ' + err.message)
    }
  }

  // WhatsApp share
  const handleShareWhatsApp = (cob: Cobranca) => {
    const tel = cob.cliente?.whatsapp || cob.cliente?.telefone || ''
    const cleanTel = tel.replace(/\D/g, '')
    const mensagem = encodeURIComponent(
      `Olá ${cob.cliente?.nome}! Segue o fechamento da medição *${cob.numero}* da Cambuí Terraplenagem:\n` +
        `Obra: ${cob.obra?.nome || 'Geral'}\n` +
        `Período: ${formatDateBR(cob.periodo_inicio)} a ${formatDateBR(cob.periodo_fim)}\n` +
        `Total de Horas: ${formatHoursShort(cob.horas_totais)}\n` +
        `Valor Total: ${formatCurrency(cob.valor_total)}\n` +
        `Vencimento: ${formatDateBR(cob.data_vencimento)}\n` +
        `Chave Pix para pagamento: CNPJ 12.345.678/0001-90 (Cambuí Terraplenagem Ltda).\n` +
        `Obrigado pela parceria!`,
    )
    const link = cleanTel
      ? `https://wa.me/55${cleanTel}?text=${mensagem}`
      : `https://wa.me/?text=${mensagem}`
    window.open(link, '_blank')
  }

  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            FINANCEIRO & COBRANÇA
          </h2>
          <p className="text-xs text-muted-foreground">
            Fechamento por cliente/período, medições faturadas, pagamentos e envio via WhatsApp
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-muted rounded-xl text-xs font-bold self-start">
          <button
            onClick={() => setAba('cobrancas_emitidas')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              aba === 'cobrancas_emitidas'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Medições / Cobranças ({cobrancas.length})
          </button>
          <button
            onClick={() => setAba('nova_medicao')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              aba === 'nova_medicao' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            + Fechamento por Cliente
          </button>
        </div>
      </div>

      {/* 1. ABA COBRANÇAS EMITIDAS */}
      {aba === 'cobrancas_emitidas' && (
        <div className="space-y-3">
          {cobrancas.length === 0 ? (
            <div className="p-8 text-center border rounded-xl bg-card text-xs text-muted-foreground">
              Nenhuma medição gerada ainda. Clique em "+ Fechamento por Cliente" para faturar
              apontamentos!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cobrancas.map((cob) => {
                const emAberto = Number(cob.valor_total) - Number(cob.valor_pago)
                const vencida = cob.data_vencimento < hoje && cob.status !== 'pago'

                return (
                  <Card key={cob.id} className="border-2 shadow-sm space-y-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-foreground">
                              {cob.numero}
                            </span>
                            {cob.status === 'pago' ? (
                              <Badge className="bg-emerald-600 text-[10px]">PAGO</Badge>
                            ) : vencida || cob.status === 'atrasado' ? (
                              <Badge variant="destructive" className="text-[10px]">
                                ATRASADO
                              </Badge>
                            ) : cob.status === 'pago_parcial' ? (
                              <Badge className="bg-blue-600 text-[10px]">PAGO PARCIAL</Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-amber-500 text-amber-600 text-[10px]"
                              >
                                EM ABERTO
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-foreground mt-1">
                            {cob.cliente?.nome}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Obra: {cob.obra?.nome || 'Todas as obras'}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-foreground">
                            {formatCurrency(cob.valor_total)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatHoursShort(cob.horas_totais)}
                          </div>
                        </div>
                      </div>

                      {/* Payment progress */}
                      <div className="bg-muted/40 p-2.5 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vencimento:</span>
                          <span
                            className={`font-semibold ${vencida ? 'text-red-600 font-bold' : ''}`}
                          >
                            {formatDateBR(cob.data_vencimento)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pago:</span>
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(cob.valor_pago)}
                          </span>
                        </div>
                        {emAberto > 0 && (
                          <div className="flex justify-between border-t pt-1">
                            <span className="text-muted-foreground font-semibold">
                              Saldo Devedor:
                            </span>
                            <span className="font-bold text-amber-600">
                              {formatCurrency(emAberto)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t">
                        {emAberto > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setModalPagamento(cob)
                              setValorPagamento(emAberto.toString())
                            }}
                            className="text-xs h-8 font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Receber
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCobrancaRelatorio(cob)}
                          className="text-xs h-8 font-semibold gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> Relatório PDF
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleShareWhatsApp(cob)}
                          className="text-xs h-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5" /> WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. ABA FECHAMENTO POR CLIENTE */}
      {aba === 'nova_medicao' && (
        <div className="space-y-4">
          <Card className="border-2 shadow-sm">
            <CardHeader className="p-4 pb-2 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Passo 1: Selecionar Cliente e Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">Cliente *</Label>
                  <select
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value)
                      setSelecionadosIds([])
                    }}
                    className="w-full h-11 text-xs rounded-md border border-input bg-background px-2.5 mt-1 font-semibold"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold">
                    Obra (Opcional - deixar vazio para todas)
                  </Label>
                  <select
                    value={obraId}
                    onChange={(e) => {
                      setObraId(e.target.value)
                      setSelecionadosIds([])
                    }}
                    className="w-full h-11 text-xs rounded-md border border-input bg-background px-2.5 mt-1"
                  >
                    <option value="">Todas as obras deste cliente</option>
                    {obras
                      .filter((o) => !clienteId || o.cliente_id === clienteId)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-bold">Início Período</Label>
                  <Input
                    type="date"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                    className="h-10 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Fim Período</Label>
                  <Input
                    type="date"
                    value={periodoFim}
                    onChange={(e) => setPeriodoFim(e.target.value)}
                    className="h-10 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Vencimento da Fatura</Label>
                  <Input
                    type="date"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                    className="h-10 text-xs font-bold text-amber-600 mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table of approved unbilled appointments */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">
                  Apontamentos Aprovados Prontos para Faturar ({apontamentosDoCliente.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Marque os dias que farão parte desta medição
                </p>
              </div>
              {apontamentosDoCliente.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selecionarTodos}
                  className="text-xs h-8"
                >
                  {selecionadosIds.length === apontamentosDoCliente.length
                    ? 'Desmarcar Todos'
                    : 'Marcar Todos'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {apontamentosDoCliente.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Nenhum apontamento aprovado pendente de faturamento para este cliente.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-3 text-left w-10"></th>
                      <th className="p-3 text-left">Data</th>
                      <th className="p-3 text-left">Máquina</th>
                      <th className="p-3 text-left">Obra</th>
                      <th className="p-3 text-right">Horas</th>
                      <th className="p-3 text-right">Preço/h</th>
                      <th className="p-3 text-right">Total R$</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {apontamentosDoCliente.map((ap) => {
                      const isSel = selecionadosIds.includes(ap.id)
                      return (
                        <tr
                          key={ap.id}
                          onClick={() => toggleApontamento(ap.id)}
                          className={`cursor-pointer transition-colors ${
                            isSel ? 'bg-amber-500/10 font-semibold' : 'hover:bg-muted/40'
                          }`}
                        >
                          <td className="p-3 text-center">
                            <Checkbox
                              checked={isSel}
                              onCheckedChange={() => toggleApontamento(ap.id)}
                            />
                          </td>
                          <td className="p-3 font-bold">{formatDateBR(ap.data)}</td>
                          <td className="p-3">{ap.maquina?.modelo}</td>
                          <td className="p-3">{ap.obra?.nome}</td>
                          <td className="p-3 text-right font-mono font-bold">
                            {formatHoursShort(ap.horas_trabalhadas)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {formatCurrency(ap.valor_hora_aplicado)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-600">
                            {formatCurrency(ap.valor_total)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Footer Totalizer & Emit Button */}
          {selecionadosIds.length > 0 && (
            <div className="bg-amber-500/15 border-2 border-amber-500 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Resumo da Medição
                </span>
                <div className="text-xl sm:text-2xl font-black text-foreground">
                  {formatCurrency(totalValorSel)}
                </div>
                <div className="text-xs text-muted-foreground font-semibold">
                  {formatHoursShort(totalHorasSel)} • {selecionadosIds.length} dia(s) selecionado(s)
                </div>
              </div>

              <Button
                onClick={handleGerarMedicao}
                disabled={gerando}
                className="h-14 px-6 text-base font-black bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5" />
                GERAR MEDIÇÃO & COBRANÇA
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODAL REGISTRAR PAGAMENTO */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmarPagamento}
            className="bg-card border-2 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-fade-in-up"
          >
            <h3 className="text-base font-black text-foreground">Registrar Pagamento</h3>

            <div className="p-3 bg-muted rounded-xl text-xs space-y-1">
              <div>
                <strong>Medição:</strong> {modalPagamento.numero}
              </div>
              <div>
                <strong>Cliente:</strong> {modalPagamento.cliente?.nome}
              </div>
              <div>
                <strong>Valor Total da Medição:</strong>{' '}
                {formatCurrency(modalPagamento.valor_total)}
              </div>
              <div>
                <strong>Já Pago:</strong> {formatCurrency(modalPagamento.valor_pago)}
              </div>
              <div>
                <strong>Saldo Devedor:</strong>{' '}
                {formatCurrency(
                  Number(modalPagamento.valor_total) - Number(modalPagamento.valor_pago),
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">
                Valor Pago (R$) * (permite pagamento parcial)
              </Label>
              <Input
                type="number"
                step="0.01"
                required
                value={valorPagamento}
                onChange={(e) => setValorPagamento(e.target.value)}
                className="h-12 text-lg font-bold font-mono text-emerald-600 mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Forma de Pagamento</Label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full h-11 text-xs rounded-md border border-input bg-background px-2.5 mt-1 font-semibold"
              >
                <option value="Pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="transferência">Transferência (TED/DOC)</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold">Observação / Comprovante</Label>
              <Input
                placeholder="Ex: Chave Pix Itaú, comprovante #99482"
                value={obsPagamento}
                onChange={(e) => setObsPagamento(e.target.value)}
                className="h-10 text-xs mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalPagamento(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Confirmar Recebimento
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL RELATÓRIO PDF MEDIÇÃO */}
      {cobrancaRelatorio && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-zinc-900 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl my-auto print:p-0 print:shadow-none">
            {/* Header with logo & company */}
            <div className="border-b-2 border-amber-500 pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black tracking-tight text-amber-600">
                  CAMBUÍ TERRAPLENAGEM
                </h1>
                <p className="text-xs text-zinc-600 font-semibold">
                  Relatório de Medição de Serviços e Locação de Máquinas
                </p>
                <p className="text-[10px] text-zinc-500">
                  Cambuí - MG • Telefone / WhatsApp: (35) 99876-5432
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-zinc-100 px-2 py-1 rounded">
                  {cobrancaRelatorio.numero}
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">Emissão: {formatDateBR(hoje)}</p>
              </div>
            </div>

            {/* Client info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-3 rounded-xl border">
              <div>
                <strong>Cliente:</strong> {cobrancaRelatorio.cliente?.nome}
                <div>
                  <strong>CNPJ/CPF:</strong>{' '}
                  {cobrancaRelatorio.cliente?.cpf_cnpj || 'Não informado'}
                </div>
                <div>
                  <strong>Telefone:</strong>{' '}
                  {cobrancaRelatorio.cliente?.telefone || 'Não informado'}
                </div>
              </div>
              <div>
                <strong>Obra / Local:</strong>{' '}
                {cobrancaRelatorio.obra?.nome || 'Conforme apontamentos'}
                <div>
                  <strong>Período de Execução:</strong>{' '}
                  {formatDateBR(cobrancaRelatorio.periodo_inicio)} a{' '}
                  {formatDateBR(cobrancaRelatorio.periodo_fim)}
                </div>
                <div>
                  <strong>Vencimento:</strong>{' '}
                  <span className="font-bold text-amber-700">
                    {formatDateBR(cobrancaRelatorio.data_vencimento)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total summary */}
            <div className="border rounded-xl p-4 bg-amber-50 border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-amber-900">Total Faturado</span>
                <div className="text-2xl font-black text-amber-700 font-mono">
                  {formatCurrency(cobrancaRelatorio.valor_total)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-zinc-600">Horas Totais Produzidas:</span>
                <div className="text-xl font-mono font-bold text-zinc-800">
                  {formatHoursShort(cobrancaRelatorio.horas_totais)}
                </div>
              </div>
            </div>

            {/* Bank / Pix info */}
            <div className="text-xs p-3 bg-zinc-50 rounded-lg border text-zinc-600 space-y-1">
              <strong>Dados para Pagamento via Pix / TED:</strong>
              <div>Banco: Itaú (341) • Ag: 0123 • CC: 45678-9</div>
              <div>
                Chave Pix CNPJ: <strong>12.345.678/0001-90</strong> (Cambuí Terraplenagem Ltda)
              </div>
            </div>

            {/* Signature line */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
              <div className="border-t border-zinc-400 pt-1">Cambuí Terraplenagem</div>
              <div className="border-t border-zinc-400 pt-1">
                De acordo do Cliente ({cobrancaRelatorio.cliente?.nome})
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t print:hidden">
              <Button variant="outline" size="sm" onClick={() => setCobrancaRelatorio(null)}>
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-zinc-800 hover:bg-zinc-700 text-white gap-1 font-bold"
              >
                <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
              </Button>
              <Button
                size="sm"
                onClick={() => handleShareWhatsApp(cobrancaRelatorio)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-bold"
              >
                <Share2 className="w-4 h-4" /> Enviar no WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
