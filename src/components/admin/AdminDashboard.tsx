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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ChevronRight } from 'lucide-react'

type Detalhe = {
  titulo: string
  resumo?: string
  colunas: string[]
  direita?: number[]
  linhas: React.ReactNode[][]
  tela?: { label: string; tab: string }
}

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void
}

const clicavel =
  'cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-pepsi-600'

const VerDetalhes = () => (
  <span className="mt-1.5 inline-flex items-center text-[10px] font-bold text-pepsi-600 dark:text-pepsi-300">
    Ver detalhes <ChevronRight className="w-3 h-3" />
  </span>
)

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null)
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
    let ativo = true
    async function init(silencioso = false) {
      if (!silencioso) setLoading(true)
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
        if (!ativo) return
        const idsMaq = new Set(maqs.map((m) => m.id))
        const idsCli = new Set(clis.map((c) => c.id))
        const idsFunc = new Set(funcs.map((f) => f.id))
        // Só conta o que ainda está ligado a algum cadastro existente
        setApontamentos(
          aps.filter(
            (a) =>
              (a.maquina_id && idsMaq.has(a.maquina_id)) ||
              (a.cliente_id && idsCli.has(a.cliente_id)) ||
              (a.funcionario_id && idsFunc.has(a.funcionario_id)),
          ),
        )
        setCobrancas(cobs.filter((c) => c.cliente_id && idsCli.has(c.cliente_id)))
        setAbastecimentos(abasts.filter((a) => a.maquina_id && idsMaq.has(a.maquina_id)))
        setManutencoes(manuts.filter((m) => m.maquina_id && idsMaq.has(m.maquina_id)))
        setMaquinas(maqs)
        setClientes(clis)
        setFuncionarios(funcs)
      } finally {
        if (ativo) setLoading(false)
      }
    }
    init()
    const atualizar = () => {
      if (document.visibilityState === 'visible') init(true)
    }
    window.addEventListener('focus', atualizar)
    document.addEventListener('visibilitychange', atualizar)
    const timer = window.setInterval(() => init(true), 30000)
    return () => {
      ativo = false
      window.removeEventListener('focus', atualizar)
      document.removeEventListener('visibilitychange', atualizar)
      window.clearInterval(timer)
    }
  }, [])

  // Filter based on period
  const now = new Date()
  const hojeStr = now.toISOString().split('T')[0]

  const noPeriodo = (dataStr?: string | null) => {
    if (!dataStr) return periodoFiltro === 'tudo'
    if (periodoFiltro === 'hoje') return dataStr === hojeStr
    if (periodoFiltro === 'semana') {
      const d = new Date(dataStr)
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24))
      return diffDays <= 7
    }
    if (periodoFiltro === 'mes') return dataStr.startsWith(hojeStr.substring(0, 7))
    return true
  }
  const filteredApontamentos = apontamentos.filter((a) => noPeriodo(a.data))
  const abastPeriodo = abastecimentos.filter((a) => noPeriodo(a.data))
  const manutPeriodo = manutencoes.filter((m) => noPeriodo(m.data))

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

  const gastoCombustivel = abastPeriodo.reduce((acc, ab) => acc + Number(ab.valor_total || 0), 0)
  const litrosPeriodo = abastPeriodo.reduce((acc, ab) => acc + Number(ab.litros || 0), 0)
  const gastoManutencao = manutPeriodo.reduce((acc, m) => acc + Number(m.custo || 0), 0)

  // Hours per employee chart data
  const horasPorFuncionario = funcionarios.map((f) => {
    const total = filteredApontamentos
      .filter((a) => a.funcionario_id === f.id)
      .reduce((acc, a) => acc + Number(a.horas_trabalhadas || 0), 0)
    return {
      id: f.id,
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
      id: c.id,
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

    const litros = abastPeriodo
      .filter((ab) => ab.maquina_id === m.id)
      .reduce((acc, ab) => acc + Number(ab.litros || 0), 0)

    const consumoMedio = horas > 0 ? (litros / horas).toFixed(1) : '0'

    return {
      id: m.id,
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

  // ---------- Detalhes (tudo clicável) ----------
  const nomePeriodo =
    periodoFiltro === 'hoje'
      ? 'hoje'
      : periodoFiltro === 'semana'
        ? 'últimos 7 dias'
        : periodoFiltro === 'mes'
          ? 'este mês'
          : 'todo o período'

  const statusAp: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    devolvido: 'Devolvido',
    rascunho_foto: 'Rascunho (foto)',
  }
  const statusCob: Record<string, string> = {
    em_aberto: 'Em aberto',
    pago_parcial: 'Parcial',
    pago: 'Pago',
    atrasado: 'Atrasado',
  }

  const linhasApontamentos = (lista: Apontamento[], comValor = false) =>
    [...lista]
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
      .map((a) => [
        formatDateBR(a.data),
        a.funcionario?.nome || '—',
        a.maquina?.modelo || '—',
        a.cliente?.nome || '—',
        `${Number(a.horas_trabalhadas || 0).toFixed(1)}h`,
        comValor ? formatCurrency(Number(a.valor_total || 0)) : statusAp[a.status] || a.status,
      ])

  const detalheApontamentos = (
    titulo: string,
    lista: Apontamento[],
    comValor = false,
    tela: Detalhe['tela'] = { label: 'Abrir Lançamentos', tab: 'lancamentos' },
  ): Detalhe => {
    const horas = lista.reduce((acc, a) => acc + Number(a.horas_trabalhadas || 0), 0)
    const valor = lista.reduce((acc, a) => acc + Number(a.valor_total || 0), 0)
    return {
      titulo,
      resumo: `${lista.length} lançamento(s) · ${horas.toFixed(1)}h${comValor ? ' · ' + formatCurrency(valor) : ''} · ${nomePeriodo}`,
      colunas: [
        'Data',
        'Colaborador',
        'Máquina',
        'Cliente',
        'Horas',
        comValor ? 'Valor' : 'Situação',
      ],
      direita: [4, 5],
      linhas: linhasApontamentos(lista, comValor),
      tela,
    }
  }

  const detalheCobrancas = (
    titulo: string,
    lista: Cobranca[],
    modo: 'aberto' | 'pago',
  ): Detalhe => {
    const total = lista.reduce(
      (acc, c) =>
        acc +
        (modo === 'pago'
          ? Number(c.valor_pago || 0)
          : Number(c.valor_total) - Number(c.valor_pago)),
      0,
    )
    return {
      titulo,
      resumo: `${lista.length} cobrança(s) · ${formatCurrency(total)}`,
      colunas: [
        'Cobrança',
        'Cliente',
        'Vencimento',
        'Valor total',
        modo === 'pago' ? 'Recebido' : 'Em aberto',
        'Situação',
      ],
      direita: [3, 4],
      linhas: lista.map((c) => [
        c.numero,
        c.cliente?.nome || '—',
        formatDateBR(c.data_vencimento),
        formatCurrency(Number(c.valor_total)),
        formatCurrency(
          modo === 'pago'
            ? Number(c.valor_pago || 0)
            : Number(c.valor_total) - Number(c.valor_pago),
        ),
        c.data_vencimento < hojeStr && c.status !== 'pago'
          ? 'Atrasado'
          : statusCob[c.status] || c.status,
      ]),
      tela: { label: 'Abrir Fechamento', tab: 'fechamento' },
    }
  }

  const detalheAbastecimentos = (titulo: string, lista: Abastecimento[]): Detalhe => {
    const litros = lista.reduce((acc, a) => acc + Number(a.litros || 0), 0)
    const valor = lista.reduce((acc, a) => acc + Number(a.valor_total || 0), 0)
    return {
      titulo,
      resumo: `${lista.length} abastecimento(s) · ${Math.round(litros)} L${valor ? ' · ' + formatCurrency(valor) : ''}`,
      colunas: ['Data', 'Máquina/Veículo', 'Operador', 'Abasteceu', 'Local', 'Litros'],
      direita: [5],
      linhas: [...lista]
        .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
        .map((a) => [
          formatDateBR(a.data),
          a.maquina?.modelo || '—',
          a.operador?.nome || '—',
          a.funcionario?.nome || '—',
          a.posto_local || '—',
          `${Number(a.litros || 0)} L`,
        ]),
      tela: { label: 'Abrir Abastecimento', tab: 'abastecimento' },
    }
  }

  const detalheManutencoes = (titulo: string, lista: Manutencao[]): Detalhe => {
    const total = lista.reduce((acc, m) => acc + Number(m.custo || 0), 0)
    return {
      titulo,
      resumo: `${lista.length} manutenção(ões) · ${formatCurrency(total)}`,
      colunas: ['Data', 'Máquina', 'Tipo', 'Descrição', 'Oficina', 'Custo'],
      direita: [5],
      linhas: [...lista]
        .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
        .map((m) => [
          formatDateBR(m.data),
          m.maquina?.modelo || '—',
          m.tipo || '—',
          m.descricao || '—',
          m.oficina_responsavel || '—',
          formatCurrency(Number(m.custo || 0)),
        ]),
      tela: { label: 'Abrir Manutenção', tab: 'manutencao' },
    }
  }

  const abrirCard = (qual: string) => {
    const cobAberto = cobrancas.filter(
      (c) => c.status === 'em_aberto' || c.status === 'pago_parcial',
    )
    const cobAtrasado = cobrancas.filter(
      (c) => c.status === 'atrasado' || (c.data_vencimento < hojeStr && c.status !== 'pago'),
    )
    const cobRecebido = cobrancas.filter((c) => Number(c.valor_pago || 0) > 0)
    const mapa: Record<string, () => Detalhe> = {
      horas: () => detalheApontamentos('Horas trabalhadas', filteredApontamentos),
      produzido: () => detalheApontamentos('Valor produzido (aprovados)', aprovados, true),
      receber: () => detalheCobrancas('Total a receber', cobAberto, 'aberto'),
      atrasado: () => detalheCobrancas('Total atrasado', cobAtrasado, 'aberto'),
      recebido: () => detalheCobrancas('Total recebido', cobRecebido, 'pago'),
      combustivel: () => detalheAbastecimentos('Abastecimentos', abastPeriodo),
      manutencao: () => detalheManutencoes('Gasto com manutenção', manutPeriodo),
      pendentes: () => ({
        ...detalheApontamentos('Pendentes de aprovação', pendentesAprovacao),
        resumo: `${pendentesAprovacao.length} lançamento(s) aguardando aprovação`,
        tela: { label: 'Abrir Aprovações', tab: 'aprovacoes' },
      }),
    }
    setDetalhe(mapa[qual]())
  }

  const propsCard = (qual: string) => ({
    role: 'button' as const,
    tabIndex: 0,
    onClick: () => abrirCard(qual),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') abrirCard(qual)
    },
  })

  const abrirFuncionario = (id?: string) => {
    const f = funcionarios.find((x) => x.id === id)
    if (!f) return
    setDetalhe(
      detalheApontamentos(
        `Horas de ${f.nome || 'colaborador'}`,
        filteredApontamentos.filter((a) => a.funcionario_id === f.id),
      ),
    )
  }

  const abrirCliente = (id?: string) => {
    const c = clientes.find((x) => x.id === id)
    if (!c) return
    setDetalhe(
      detalheApontamentos(
        `Horas para ${c.nome || 'cliente'}`,
        filteredApontamentos.filter((a) => a.cliente_id === c.id),
      ),
    )
  }

  const abrirMaquina = (id?: string) => {
    const m = maquinas.find((x) => x.id === id)
    if (!m) return
    const aps = filteredApontamentos.filter((a) => a.maquina_id === m.id)
    const abs = abastecimentos.filter((a) => a.maquina_id === m.id)
    const base = detalheApontamentos(`${m.modelo || 'Máquina'} — horas e diesel`, aps)
    const litros = abs.reduce((acc, a) => acc + Number(a.litros || 0), 0)
    setDetalhe({
      ...base,
      resumo: `${base.resumo} · ${Math.round(litros)} L abastecidos (${abs.length} abastecimento(s))`,
      linhas: [
        ...base.linhas,
        ...abs.map((a) => [
          formatDateBR(a.data),
          a.funcionario?.nome || '—',
          m.modelo || '—',
          'Abastecimento',
          `${Number(a.litros || 0)} L`,
          a.posto_local || '—',
        ]),
      ],
    })
  }

  const abrirCobranca = (cob: Cobranca) => {
    const pags = cob.pagamentos || []
    setDetalhe({
      titulo: `Cobrança ${cob.numero}`,
      resumo: `${cob.cliente?.nome || '—'} · período ${formatDateBR(cob.periodo_inicio)} a ${formatDateBR(cob.periodo_fim)} · ${Number(cob.horas_totais || 0).toFixed(1)}h · total ${formatCurrency(Number(cob.valor_total))} · pago ${formatCurrency(Number(cob.valor_pago || 0))} · vence ${formatDateBR(cob.data_vencimento)}`,
      colunas: ['Data do pagamento', 'Forma', 'Observação', 'Valor'],
      direita: [3],
      linhas: pags.map((p) => [
        formatDateBR(p.data),
        p.forma_pagamento,
        p.observacao || '—',
        formatCurrency(Number(p.valor)),
      ]),
      tela: { label: 'Abrir Fechamento', tab: 'fechamento' },
    })
  }

  const abrirAlertaOleo = (m: Maquina) => {
    setDetalhe({
      ...detalheManutencoes(
        `${m.tipo || ''} ${m.modelo || ''} — troca de óleo`,
        manutencoes.filter((x) => x.maquina_id === m.id),
      ),
      resumo: `Horímetro atual ${Number(m.horimetro_atual || 0)}h · última troca em ${Number(m.horimetro_ultima_troca || 0)}h · intervalo ${Number(m.intervalo_troca_oleo || 0)}h`,
    })
  }

  const abrirSemLancamento = (f: Funcionario) => {
    setDetalhe({
      ...detalheApontamentos(
        `${f.nome || 'Colaborador'} — últimos lançamentos`,
        apontamentos.filter((a) => a.funcionario_id === f.id).slice(0, 30),
      ),
      resumo: `Não há lançamento em ${formatDateBR(yesterdayStr)}. Abaixo, os últimos registros.`,
    })
  }

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
        <div className="bg-prata-300/35 border-2 border-prata-400/70 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-pepsi-950 dark:text-pepsi-200 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-pepsi-600 dark:text-pepsi-300" />
            Alertas Operacionais Pendentes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {alertasOleo.map((al) => (
              <div
                key={al.maquina.id}
                onClick={() => abrirAlertaOleo(al.maquina)}
                className="flex items-center justify-between p-2 rounded-lg bg-card border border-prata-400/60 cursor-pointer hover:border-pepsi-600"
              >
                <span className="font-semibold text-foreground">
                  🔧 {al.maquina.tipo} ({al.maquina.modelo})
                </span>
                {al.atrasada ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Óleo ATRASADO {Math.abs(al.restam).toFixed(0)}h
                  </Badge>
                ) : (
                  <Badge className="bg-pepsi-600 text-white text-[10px]">
                    Troca em {al.restam.toFixed(0)}h
                  </Badge>
                )}
              </div>
            ))}
            {funcionariosSemLancamentoOntem.map((f) => (
              <div
                key={f.id}
                onClick={() => abrirSemLancamento(f)}
                className="flex items-center justify-between p-2 rounded-lg bg-card border border-prata-400/60 cursor-pointer hover:border-pepsi-600"
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
        <Card
          className={`border-2 border-prata-400/60 bg-gradient-to-br from-prata-300/25 to-transparent ${clicavel}`}
          {...propsCard('horas')}
        >
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Horas Trabalhadas</span>
              <Clock className="w-4 h-4 text-pepsi-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {formatHoursShort(totalHorasTrabalhadas)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              No período selecionado
            </p>
            <VerDetalhes />
          </CardContent>
        </Card>

        {/* Valor produzido */}
        <Card
          className={`border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent ${clicavel}`}
          {...propsCard('produzido')}
        >
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
            <VerDetalhes />
          </CardContent>
        </Card>

        {/* A receber / Em aberto */}
        <Card
          className={`border-2 border-blue-500/30 bg-card ${clicavel}`}
          {...propsCard('receber')}
        >
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
            <VerDetalhes />
          </CardContent>
        </Card>

        {/* Atrasado */}
        <Card
          className={`border-2 border-red-500/30 bg-card ${clicavel}`}
          {...propsCard('atrasado')}
        >
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
            <VerDetalhes />
          </CardContent>
        </Card>

        {/* Total Recebido */}
        <Card className={`border-2 border-border bg-card ${clicavel}`} {...propsCard('recebido')}>
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
            <VerDetalhes />
          </CardContent>
        </Card>

        {/* Gasto combustível */}
        <Card
          className={`border-2 border-border bg-card ${clicavel}`}
          {...propsCard('combustivel')}
        >
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>Combustível</span>
              <Fuel className="w-4 h-4 text-pepsi-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-pepsi-600 dark:text-pepsi-300 tracking-tight">
              {Math.round(litrosPeriodo).toLocaleString('pt-BR')} L
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {abastPeriodo.length} abastecimento(s)
              {gastoCombustivel > 0 ? ` · ${formatCurrency(gastoCombustivel)}` : ''}
            </p>
            <VerDetalhes />
          </CardContent>
        </Card>

        {/* Gasto manutenção */}
        <Card className={`border-2 border-border bg-card ${clicavel}`} {...propsCard('manutencao')}>
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
            <VerDetalhes />
          </CardContent>
        </Card>

        {/* Apontamentos pendentes */}
        <Card
          className={`border-2 border-pepsi-600 bg-prata-300/25 ${clicavel}`}
          {...propsCard('pendentes')}
        >
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-pepsi-950 dark:text-pepsi-200 flex items-center justify-between">
              <span>Pendentes de Aprovação</span>
              <AlertCircle className="w-4 h-4 text-pepsi-600 dark:text-pepsi-300" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl sm:text-3xl font-black text-pepsi-600 dark:text-pepsi-300 tracking-tight">
              {pendentesAprovacao.length}
            </div>
            <p className="text-[11px] text-pepsi-950/80 dark:text-pepsi-300 mt-0.5 font-bold">
              Aguardando escritório
            </p>
            <VerDetalhes />
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Horas por funcionário */}
        <Card className="border-2">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-sm font-bold">Horas Trabalhadas por Funcionário</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Toque numa barra para ver os lançamentos
            </p>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horasPorFuncionario}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip />
                <Bar
                  dataKey="horas"
                  fill="#004b93"
                  radius={[4, 4, 0, 0]}
                  className="cursor-pointer"
                  onClick={(d: any) => abrirFuncionario(d?.payload?.id ?? d?.id)}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Horas por cliente */}
        <Card className="border-2">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-sm font-bold">Horas Trabalhadas por Cliente</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Toque numa barra para ver os lançamentos
            </p>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horasPorCliente}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="cliente" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip />
                <Bar
                  dataKey="horas"
                  fill="#8fa3bd"
                  radius={[4, 4, 0, 0]}
                  className="cursor-pointer"
                  onClick={(d: any) => abrirCliente(d?.payload?.id ?? d?.id)}
                />
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
                <tr
                  key={idx}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => abrirMaquina(m.id)}
                >
                  <td className="p-3 font-bold text-foreground">{m.modelo}</td>
                  <td className="p-3 text-right font-mono font-bold text-pepsi-600 dark:text-pepsi-300">
                    {m.horas}h
                  </td>
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
                  <tr
                    key={cob.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => abrirCobranca(cob)}
                  >
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
                          className="border-pepsi-600 text-pepsi-600 dark:text-pepsi-300 text-[10px]"
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

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-pepsi-600 dark:text-pepsi-300 font-black">
              {detalhe?.titulo}
            </DialogTitle>
            {detalhe?.resumo && (
              <DialogDescription className="text-xs">{detalhe.resumo}</DialogDescription>
            )}
          </DialogHeader>
          <div className="overflow-auto flex-1 -mx-2 px-2">
            {detalhe && detalhe.linhas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum registro encontrado.
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground uppercase text-[10px] sticky top-0">
                  <tr>
                    {detalhe?.colunas.map((c, i) => (
                      <th
                        key={i}
                        className={`p-2 ${detalhe.direita?.includes(i) ? 'text-right' : 'text-left'}`}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {detalhe?.linhas.map((l, li) => (
                    <tr key={li} className="hover:bg-muted/40">
                      {l.map((v, ci) => (
                        <td
                          key={ci}
                          className={`p-2 ${detalhe.direita?.includes(ci) ? 'text-right font-mono' : ''}`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {detalhe?.tela && onNavigate && (
            <Button
              className="w-full mt-2 font-bold"
              onClick={() => {
                const tab = detalhe.tela!.tab
                setDetalhe(null)
                onNavigate(tab)
              }}
            >
              {detalhe.tela.label} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
