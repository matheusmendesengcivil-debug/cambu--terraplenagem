import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Fuel,
  Wrench,
  TrendingUp,
  Download,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import {
  getApontamentos,
  getCobrancas,
  getAbastecimentos,
  getManutencoes,
  getMaquinas,
  getClientes,
  getObras,
  getFuncionarios,
} from '@/services/cambui'
import {
  Apontamento,
  Cobranca,
  Abastecimento,
  Manutencao,
  Maquina,
  Cliente,
  Obra,
  Funcionario,
} from '@/types/cambui'
import { formatCurrency, formatHoursShort, formatDateBR } from '@/lib/formatters'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import { toast } from 'sonner'

export const AdminDashboard: React.FC = () => {
  const [periodoFiltro, setPeriodoFiltro] = useState<'hoje' | 'semana' | 'mes' | 'tudo'>('semana')
  const [loading, setLoading] = useState(true)

  const [apontamentos, setApontamentos] = useState<Apontamento[]>([])
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([])
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [aps, cobs, abasts, manuts, maqs, clis, funcs] = await Promise.all([
          getApontamentos(),
          getCobrancas(),
          getAbastecimentos(),
          getManutencoes(),
          getMaquinas(),
          getClientes(),
          getFuncionarios(),
        ])
        setApontamentos(aps)
        setCobrancas(cobs)
        setAbastecimentos(abasts)
        setManutencoes(manuts)
        setMaquinas(maqs)
        setClientes(clis)
        setFuncionarios(funcs)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Filter based on period
  const now = new Date()
  const hojeStr = now.toISOString().split('T')[0]

  const filteredApontamentos = apontamentos.filter((a) => {
    if (periodoFiltro === 'hoje') return a.data === hojeStr
    if (periodoFiltro === 'semana') {
      const d = new Date(a.data)
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24))
      return diffDays <= 7
    }
    if (periodoFiltro === 'mes') {
      return a.data.startsWith(hojeStr.substring(0, 7))
    }
    return true
  })

  // Approved appointments in period
  const aprovados = filteredApontamentos.filter((a) => a.status === 'aprovado')
  const pendentesAprovacao = apontamentos.filter(
    (a) => a.status === 'pendente' || a.status === 'rascunho_foto',
  )

  // KPI Calculations
  const totalHorasTrabalhadas = filteredApontamentos.reduce(
    (acc, a) => acc + Number(a.horas_trabalhadas || 0),
    0,
  )
  const valorProduzido = aprovados.reduce((acc, a) => acc + Number(a.valor_total || 0), 0)

  // Billing status
  const totalAReceber = cobrancas
    .filter((c) => c.status === 'em_aberto' || c.status === 'pago_parcial')
    .reduce((acc, c) => acc + (Number(c.valor_total) - Number(c.valor_pago)), 0)

  const totalAtrasado = cobrancas
    .filter((c) => c.status === 'atrasado' || (c.data_vencimento < hojeStr && c.status !== 'pago'))
    .reduce((acc, c) => acc + (Number(c.valor_total) - Number(c.valor_pago)), 0)

  const totalRecebido = cobrancas.reduce((acc, c) => acc + Number(c.valor_pago || 0), 0)

  const gastoCombustivel = abastecimentos.reduce((acc, ab) => acc + Number(ab.valor_total || 0), 0)
  const gastoManutencao = manutencoes.reduce((acc, m) => acc + Number(m.custo || 0), 0)

  // Hours per employee chart data
  const horasPorFuncionario = funcionarios.map((f) => {
    const total = filteredApontamentos
      .filter((a) => a.funcionario_id === f.id)
      .reduce((acc, a) => acc + Number(a.horas_trabalhadas || 0), 0)
    return {
      nome: (f.nome || 'Sem nome').split(' ')[0],
      horas: Number(total.toFixed(1)),
    }
  })

  // Hours per client chart data
  const horasPorCliente = clientes.map((c) => {
    const total = filteredApontamentos
      .filter((a) => a.cliente_id === c.id)
      .reduce((acc, a) => acc + Number(a.horas_trabalhadas || 0), 0)
    return {
      cliente:
        (c.nome || 'Sem nome').length > 15
          ? (c.nome || '').substring(0, 15) + '...'
          : c.nome || 'Sem nome',
      horas: Number(total.toFixed(1)),
    }
  })

  // Machine hours & fuel consumption
  const horasEConsumoPorMaquina = maquinas.map((m) => {
    const horas = filteredApontamentos
      .filter((a) => a.maquina_id === m.id)
      .reduce((acc, a) => acc + Number(a.horas_trabalhadas || 0), 0)

    const litros = abastecimentos
      .filter((ab) => ab.maquina_id === m.id)
      .reduce((acc, ab) => acc + Number(ab.litros || 0), 0)

    const consumoMedio = horas > 0 ? (litros / horas).toFixed(1) : '0'

    return {
      modelo: m.modelo,
      horas: Number(horas.toFixed(1)),
      litros: Math.round(litros),
      consumoMedio,
    }
  })

  // Oil change alerts
  const alertasOleo = maquinas
    .map((m) => {
      const restam =
        Number(m.intervalo_troca_oleo) -
        (Number(m.horimetro_atual) - Number(m.horimetro_ultima_troca))
      return {
        maquina: m,
        restam,
        atrasada: restam < 0,
        proxima: restam >= 0 && restam <= 40,
      }
    })
    .filter((a) => a.atrasada || a.proxima)

  // Missing launch from yesterday check
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const funcionariosSemLancamentoOntem = funcionarios.filter((f) => {
    const tem = apontamentos.some((a) => a.funcionario_id === f.id && a.data === yesterdayStr)
    return !tem
  })

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Data;Funcionario;Maquina;Obra;Cliente;Horas;ValorTotal;Status\n'
    const rows = filteredApontamentos
      .map((a) => {
        return `${formatDateBR(a.data)};${a.funcionario?.nome || ''};${a.maquina?.modelo || ''};${a.obra?.nome || ''};${a.cliente?.nome || ''};${a.horas_trabalhadas};${a.valor_total || 0};${a.status}`
      })
      .join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `apontamentos_cambui_${hojeStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório CSV exportado com sucesso!')
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Top filters and Export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            DASHBOARD EXECUTIVO
          </h2>
          <p className="text-xs text-muted-foreground">
            Visão geral de horas, faturamento, combustíveis e frotas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex p-1 bg-muted rounded-xl text-xs font-bold">
            {(['hoje', 'semana', 'mes', 'tudo'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodoFiltro(p)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  periodoFiltro === p
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {p === 'mes' ? 'Mês' : p === 'semana' ? '7 dias' : p}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs gap-1.5 font-bold h-9 bg-card"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Alertas urgentes banner (troca de óleo ou apontamento pendente) */}
      {(alertasOleo.length > 0 || funcionariosSemLancamentoOntem.length > 0) && (
        <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Alertas Operacionais Pendentes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {alertasOleo.map((al) => (
              <div
                key={al.maquina.id}
                className="flex items-center justify-between p-2 rounded-lg bg-card border border-amber-500/30"
              >
                <span className="font-semibold text-foreground">
                  🔧 {al.maquina.tipo} ({al.maquina.modelo})
                </span>
                {al.atrasada ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Óleo ATRASADO {Math.abs(al.restam).toFixed(0)}h
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500 text-amber-950 text-[10px]">
                    Troca em {al.restam.toFixed(0)}h
                  </Badge>
                )}
              </div>
            ))}
            {funcionariosSemLancamentoOntem.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-2 rounded-lg bg-card border border-amber-500/30"
              >
                <span className="font-semibold text-foreground">⚠️ {f.nome}</span>
                <span className="text-[11px] text-muted-foreground">
                  Não lançou ontem ({formatDateBR(yesterdayStr)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8 SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total horas */}
        <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Horas Trabalhadas</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {formatHoursShort(totalHorasTrabalhadas)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        {/* Valor produzido */}
        <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Valor Produzido (Faturável)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
              {formatCurrency(valorProduzido)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Apontamentos aprovados</p>
          </CardContent>
        </Card>

        {/* A receber / Em aberto */}
        <Card className="border-2 border-blue-500/30 bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Total a Receber</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight">
              {formatCurrency(totalAReceber)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Medições em aberto</p>
          </CardContent>
        </Card>

        {/* Atrasado */}
        <Card className="border-2 border-red-500/30 bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Total Atrasado</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-red-600 tracking-tight">
              {formatCurrency(totalAtrasado)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Vencidas sem pagamento</p>
          </CardContent>
        </Card>

        {/* Total Recebido */}
        <Card className="border-2 border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Total Recebido</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(totalRecebido)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pagamentos confirmados</p>
          </CardContent>
        </Card>

        {/* Gasto combustível */}
        <Card className="border-2 border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Gasto com Combustível</span>
              <Fuel className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">
              {formatCurrency(gastoCombustivel)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Diesel e insumos</p>
          </CardContent>
        </Card>

        {/* Gasto manutenção */}
        <Card className="border-2 border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Gasto com Manutenção</span>
              <Wrench className="w-4 h-4 text-zinc-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(gastoManutencao)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Peças e oficinas</p>
          </CardContent>
        </Card>

        {/* Apontamentos pendentes */}
        <Card className="border-2 border-amber-500 bg-amber-500/10">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center justify-between">
              <span>Pendentes de Aprovação</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              {pendentesAprovacao.length}
            </div>
            <p className="text-[11px] text-amber-950/80 dark:text-amber-300 mt-0.5 font-bold">
              Aguardando escritório
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Horas por funcionário */}
        <Card className="border-2">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-sm font-bold">Horas Trabalhadas por Funcionário</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horasPorFuncionario}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip />
                <Bar dataKey="horas" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Horas por cliente */}
        <Card className="border-2">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-sm font-bold">Horas Trabalhadas por Cliente</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horasPorCliente}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="cliente" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip />
                <Bar dataKey="horas" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* MACHINE CONSUMPTION TABLE */}
      <Card className="border-2">
        <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Consumo e Horas por Máquina</CardTitle>
          <Badge variant="outline" className="text-xs">
            Média Litros/Hora
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3 text-left">Máquina</th>
                <th className="p-3 text-right">Horas no Período</th>
                <th className="p-3 text-right">Diesel Abastecido</th>
                <th className="p-3 text-right">Consumo Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {horasEConsumoPorMaquina.map((m, idx) => (
                <tr key={idx} className="hover:bg-muted/40">
                  <td className="p-3 font-bold text-foreground">{m.modelo}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-600">{m.horas}h</td>
                  <td className="p-3 text-right font-mono">{m.litros} L</td>
                  <td className="p-3 text-right font-mono font-bold text-foreground">
                    {m.consumoMedio} L/h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* CLIENT DEBT SITUATION TABLE */}
      <Card className="border-2">
        <CardHeader className="p-4 pb-2 border-b">
          <CardTitle className="text-sm font-bold">Situação Financeira dos Clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3 text-left">Cobrança</th>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Vencimento</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3 text-right">Em Aberto</th>
                <th className="p-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cobrancas.map((cob) => {
                const emAberto = Number(cob.valor_total) - Number(cob.valor_pago)
                const vencida = cob.data_vencimento < hojeStr && cob.status !== 'pago'

                return (
                  <tr key={cob.id} className="hover:bg-muted/40">
                    <td className="p-3 font-mono font-bold">{cob.numero}</td>
                    <td className="p-3 font-semibold text-foreground">{cob.cliente?.nome}</td>
                    <td className="p-3 text-muted-foreground">
                      {formatDateBR(cob.data_vencimento)}
                    </td>
                    <td className="p-3 text-right font-mono">{formatCurrency(cob.valor_total)}</td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      {formatCurrency(emAberto)}
                    </td>
                    <td className="p-3 text-center">
                      {cob.status === 'pago' ? (
                        <Badge className="bg-emerald-600 text-[10px]">Pago</Badge>
                      ) : vencida || cob.status === 'atrasado' ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Atrasado
                        </Badge>
                      ) : cob.status === 'pago_parcial' ? (
                        <Badge className="bg-blue-600 text-[10px]">Parcial</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500 text-amber-600 text-[10px]"
                        >
                          Em Aberto
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
