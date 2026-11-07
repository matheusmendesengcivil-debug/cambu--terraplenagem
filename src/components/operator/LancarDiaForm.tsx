import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  HardHat,
  ArrowLeft,
  Clock,
  Camera,
  AlertTriangle,
  CheckCircle,
  Truck,
  Sparkles,
  Search,
} from 'lucide-react'
import {
  getMaquinas,
  getObras,
  getClientes,
  getFuncionarios,
  getTiposServico,
  saveApontamento,
  getApontamentos,
} from '@/services/cambui'
import { Maquina, Obra, Cliente, Funcionario, TipoServico, Apontamento } from '@/types/cambui'
import { isVeiculo, unidadeMedidor, nomeMedidor, nomeEquipamento } from '@/lib/formatters'
import { AnexoPicker, AnexoThumb } from '@/components/shared/AnexoPicker'
import { toast } from 'sonner'

interface LancarDiaFormProps {
  onBack: () => void
  onSuccess: () => void
  /** Quando informado, o formulário abre em modo de edição */
  editing?: Apontamento | null
}

export const LancarDiaForm: React.FC<LancarDiaFormProps> = ({ onBack, onSuccess, editing }) => {
  const { usuario, user, isAdmin } = useAuth()

  const [loadingInit, setLoadingInit] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([])

  // Form states
  const hoje = new Date().toISOString().split('T')[0]
  const toStr = (v: any) => (v === null || v === undefined ? '' : String(v))
  const [data, setData] = useState(editing?.data || hoje)
  const [funcionarioId, setFuncionarioId] = useState<string>(editing?.funcionario_id || '')
  const [maquinaId, setMaquinaId] = useState<string>(editing?.maquina_id || '')
  const [obraId, setObraId] = useState<string>(editing?.obra_id || '')
  const [horimetroInicial, setHorimetroInicial] = useState<string>(
    toStr(editing?.horimetro_inicial),
  )
  const [horimetroFinal, setHorimetroFinal] = useState<string>(toStr(editing?.horimetro_final))
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>(
    (editing?.servicos || []).map((sv) => sv.id),
  )
  const [descricao, setDescricao] = useState(editing?.descricao || '')
  const [horasParadas, setHorasParadas] = useState(
    editing?.horas_paradas ? String(editing.horas_paradas) : '',
  )
  const [motivoParada, setMotivoParada] = useState(editing?.motivo_parada || '')
  const [quantidadeViagens, setQuantidadeViagens] = useState(
    editing?.quantidade_viagens ? String(editing.quantidade_viagens) : '',
  )
  const [fotosExistentes] = useState<string[]>((editing?.fotos || []).map((f) => f.url))
  const [fotos, setFotos] = useState<string[]>([])
  const [modo, setModo] = useState<'horimetro' | 'horario' | 'diaria'>(
    (editing?.modo_medicao as any) || 'horimetro',
  )
  const [periodos, setPeriodos] = useState<{ inicio: string; fim: string }[]>(
    editing?.periodos && editing.periodos.length
      ? editing.periodos
      : [
          { inicio: '07:00', fim: '12:00' },
          { inicio: '13:00', fim: '17:00' },
        ],
  )
  const [diarias, setDiarias] = useState<string>(
    editing?.diarias !== null && editing?.diarias !== undefined ? String(editing.diarias) : '1',
  )
  const [valorUnit, setValorUnit] = useState<string>(toStr(editing?.valor_hora_aplicado))
  const [valorTotalManual, setValorTotalManual] = useState<string>('')
  const [statusEdit, setStatusEdit] = useState<string>(editing?.status || 'pendente')
  const [clienteManual, setClienteManual] = useState<string>(editing?.cliente_id || '')
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'maquina' | 'veiculo'>('todos')

  // Horimeter warning if different from last recorded
  const [ultimoHorimetroRegistrado, setUltimoHorimetroRegistrado] = useState<number | null>(null)
  const [buscaObra, setBuscaObra] = useState('')

  useEffect(() => {
    async function init() {
      setLoadingInit(true)
      try {
        const [maqs, obs, clis, funcs, srvs] = await Promise.all([
          getMaquinas(),
          getObras(),
          getClientes(),
          getFuncionarios(),
          getTiposServico(),
        ])
        setMaquinas(maqs)
        setObras(obs.filter((o) => o.status === 'em_andamento' || o.id === editing?.obra_id))
        setClientes(clis)
        setFuncionarios(funcs)
        setTiposServico(srvs)

        // Pre-fill current operator's funcionario record (só em lançamento novo)
        if (!editing && (usuario || user)) {
          const match = funcs.find(
            (f) =>
              f.usuario_id === user?.id ||
              (!!usuario?.nome &&
                (f.nome || '').toLowerCase().includes(usuario.nome.toLowerCase())),
          )
          if (match) setFuncionarioId(match.id)
        }
      } finally {
        setLoadingInit(false)
      }
    }
    init()
  }, [usuario, user, editing])

  // When machine is selected, pre-fill initial horimeter and check last final
  const handleSelectMaquina = async (mId: string) => {
    if (maquinaId === mId) {
      setMaquinaId('')
      setUltimoHorimetroRegistrado(null)
      return
    }
    setMaquinaId(mId)
    const selected = maquinas.find((m) => m.id === mId)
    if (selected && isAdmin && !valorUnit && modo !== 'diaria') {
      setValorUnit(String(selected.valor_hora_padrao || ''))
    }
    if (selected) {
      const hAtual = Number(selected.horimetro_atual || 0)
      if (!editing) setHorimetroInicial(hAtual.toString())
      setUltimoHorimetroRegistrado(hAtual)
    }
  }

  // Horas calculadas
  const hIni = parseFloat(horimetroInicial) || 0
  const hFim = parseFloat(horimetroFinal) || 0
  const horasCalculadas = hFim > hIni ? hFim - hIni : 0
  const minutos = (t: string) => {
    const [h, m] = (t || '').split(':').map(Number)
    return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : NaN
  }
  const horasPeriodos = periodos.reduce((acc, p) => {
    const a = minutos(p.inicio)
    const b = minutos(p.fim)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return acc
    return acc + (b >= a ? b - a : b + 1440 - a) / 60
  }, 0)
  const numDiarias = parseFloat((diarias || '').replace(',', '.')) || 0
  const horasDoModo = modo === 'horario' ? horasPeriodos : modo === 'horimetro' ? horasCalculadas : 0
  const valorUnitNum = parseFloat((valorUnit || '').replace(',', '.')) || 0
  const valorTotalCalc = valorUnitNum * (modo === 'diaria' ? numDiarias : horasDoModo)

  // Selected obra details
  const obraSelecionada = obras.find((o) => o.id === obraId)
  const clienteSelecionado = clientes.find((c) => c.id === obraSelecionada?.cliente_id)

  // Machine selected details
  const maquinaSelecionada = maquinas.find((m) => m.id === maquinaId)
  const veiculo = isVeiculo(maquinaSelecionada)
  const un = unidadeMedidor(maquinaSelecionada)
  const medidor = nomeMedidor(maquinaSelecionada)
  const isCaminhao =
    veiculo ||
    (maquinaSelecionada?.tipo || '').toLowerCase().includes('caminh') ||
    (maquinaSelecionada?.modelo || '').toLowerCase().includes('constellation')
  const maquinasFiltradas = maquinas.filter(
    (m) => filtroCategoria === 'todos' || (m.categoria || 'maquina') === filtroCategoria,
  )

  // Horimeter warning check
  const temDivergenciaHorimetro =
    !editing &&
    ultimoHorimetroRegistrado !== null &&
    hIni > 0 &&
    Math.abs(hIni - ultimoHorimetroRegistrado) > 0.1

  const toggleServico = (sId: string) => {
    if (servicosSelecionados.includes(sId)) {
      setServicosSelecionados(servicosSelecionados.filter((id) => id !== sId))
    } else {
      setServicosSelecionados([...servicosSelecionados, sId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Campos são opcionais: só avisa se o final for menor que o inicial
    if (horimetroInicial && horimetroFinal && hFim < hIni) {
      toast.warning(`Atenção: ${medidor} final menor que o inicial. Salvando mesmo assim.`)
    }
    const temMedicao = horimetroInicial !== '' && horimetroFinal !== '' && hFim > hIni

    setSalvando(true)
    try {
      const res = await saveApontamento(
        {
          id: editing?.id,
          data,
          funcionario_id: funcionarioId || null,
          maquina_id: maquinaId || null,
          cliente_id: clienteManual || obraSelecionada?.cliente_id || null,
          obra_id: obraId || null,
          horimetro_inicial: horimetroInicial === '' ? null : hIni,
          horimetro_final: horimetroFinal === '' ? null : hFim,
          // Para veículo a diferença é km rodado, não hora trabalhada
          horas_trabalhadas:
            modo === 'horario'
              ? horasPeriodos > 0
                ? Number(horasPeriodos.toFixed(2))
                : null
              : modo === 'horimetro' && temMedicao && !veiculo
                ? Number(horasCalculadas.toFixed(1))
                : null,
          modo_medicao: modo,
          periodos: modo === 'horario' ? periodos.filter((p) => p.inicio || p.fim) : null,
          diarias: modo === 'diaria' ? numDiarias : null,
          horas_paradas: horasParadas ? parseFloat(horasParadas) : 0,
          motivo_parada: motivoParada || null,
          quantidade_viagens: quantidadeViagens ? parseInt(quantidadeViagens) : 0,
          descricao,
          // Operador corrigindo um lançamento devolvido: volta para aprovação
          status: isAdmin && editing
            ? (statusEdit as any)
            : editing
            ? editing.status === 'devolvido' && !isAdmin
              ? 'pendente'
              : editing.status
            : 'pendente',
          valor_hora_aplicado: isAdmin
            ? valorUnit === ''
              ? undefined
              : valorUnitNum
            : editing?.valor_hora_aplicado ?? undefined,
          valor_total:
            isAdmin && valorTotalManual !== ''
              ? parseFloat(valorTotalManual.replace(',', '.')) || 0
              : undefined,
        },
        servicosSelecionados,
        fotos,
        { substituirServicos: !!editing },
      )

      if (res.offline) {
        toast.warning(
          'Apontamento salvo no aparelho (OFFLINE). Será sincronizado automaticamente quando houver sinal!',
        )
      } else if (editing) {
        toast.success('Lançamento atualizado!')
      } else {
        toast.success('Apontamento enviado com sucesso! Status: Pendente de aprovação.')
      }
      onSuccess()
    } catch (err: any) {
      toast.error('Erro ao salvar apontamento: ' + (err.message || 'Tente novamente'))
    } finally {
      setSalvando(false)
    }
  }

  const obrasFiltradas = obras.filter(
    (o) =>
      (o.nome || '').toLowerCase().includes(buscaObra.toLowerCase()) ||
      (o.cliente?.nome || '').toLowerCase().includes(buscaObra.toLowerCase()),
  )

  return (
    <div className="space-y-4 pb-16 max-w-lg mx-auto">
      {/* Header bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">
            {editing ? 'EDITAR LANÇAMENTO' : 'LANÇAR DIA'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Todos os campos são opcionais — preencha o que tiver
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. DATA E FUNCIONÁRIO */}
        <Card className="border-2">
          <CardHeader className="p-3.5 pb-2 border-b bg-muted/40">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data" className="text-xs font-bold">
                  Data do Serviço
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="h-12 text-sm font-semibold mt-1"
                />
              </div>
              <div>
                <Label htmlFor="funcionario" className="text-xs font-bold">
                  Operador
                </Label>
                <select
                  id="funcionario"
                  value={funcionarioId}
                  onChange={(e) => setFuncionarioId(e.target.value)}
                  className="w-full h-12 text-sm font-semibold rounded-md border border-input bg-background px-3 mt-1"
                >
                  <option value="">— Não informado —</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome || 'Sem nome'}
                      {f.funcao ? ` (${f.funcao.split(' ')[0]})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. MÁQUINA E HORÍMETROS */}
        <Card className="border-2 border-prata-400/70 shadow-sm">
          <CardHeader className="p-3.5 pb-2 border-b bg-prata-300/25">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-pepsi-900 dark:text-pepsi-200 flex items-center justify-between">
              <span>2. Máquina / Veículo & {veiculo ? 'Km' : 'Horímetro'}</span>
              <HardHat className="w-4 h-4 text-pepsi-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Escolha a máquina ou veículo</Label>
                <div className="flex gap-1 text-[10px] font-bold">
                  {(['todos', 'maquina', 'veiculo'] as const).map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFiltroCategoria(c)}
                      className={`px-2 py-1 rounded-md ${filtroCategoria === c ? 'bg-pepsi-600 text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      {c === 'todos' ? 'Todos' : c === 'maquina' ? 'Máquinas' : 'Veículos'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-1">
                {maquinasFiltradas.map((m) => {
                  const isSelected = maquinaId === m.id
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => handleSelectMaquina(m.id)}
                      className={`p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-pepsi-600 bg-prata-300/35 font-bold shadow-sm'
                          : 'border-border bg-card hover:border-prata-400/70'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-black text-foreground">
                          {nomeEquipamento(m)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isVeiculo(m) ? '🚚 Veículo' : '🚜 Máquina'}
                          {m.placa_identificacao ? ` • ${m.placa_identificacao}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">Último:</span>
                        <div className="text-sm font-mono font-bold text-pepsi-600 dark:text-pepsi-300">
                          {m.horimetro_atual}
                          {unidadeMedidor(m)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Warning if initial differs from last recorded */}
            {temDivergenciaHorimetro && (
              <div className="p-2.5 rounded-lg bg-prata-300/45 border border-pepsi-600 text-pepsi-950 dark:text-pepsi-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-pepsi-600 dark:text-pepsi-300 shrink-0" />
                <span>
                  Aviso: o {medidor.toLowerCase()} inicial digitado ({hIni}
                  {un}) é diferente do último registro ({ultimoHorimetroRegistrado}
                  {un}).
                </span>
              </div>
            )}

            <div>
              <Label className="text-xs font-bold">Como medir</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {(
                  [
                    ['horimetro', veiculo ? 'Km' : 'Horímetro'],
                    ['horario', 'Horário'],
                    ['diaria', 'Diária'],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setModo(k)}
                    className={`h-11 rounded-lg border-2 text-xs font-black ${
                      modo === k
                        ? 'border-pepsi-600 bg-pepsi-600 text-white'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {modo === 'horario' && (
              <div className="space-y-2">
                {periodos.map((p, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-[11px] font-bold">Início</Label>
                      <Input
                        type="time"
                        value={p.inicio}
                        onChange={(e) =>
                          setPeriodos(periodos.map((x, j) => (j === i ? { ...x, inicio: e.target.value } : x)))
                        }
                        className="h-12 font-mono font-bold"
                      />
                    </div>
                    <span className="pb-3 text-xs font-bold text-muted-foreground">às</span>
                    <div className="flex-1">
                      <Label className="text-[11px] font-bold">Fim</Label>
                      <Input
                        type="time"
                        value={p.fim}
                        onChange={(e) =>
                          setPeriodos(periodos.map((x, j) => (j === i ? { ...x, fim: e.target.value } : x)))
                        }
                        className="h-12 font-mono font-bold"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-12 px-2 text-destructive"
                      onClick={() => setPeriodos(periodos.filter((_, j) => j !== i))}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 text-xs font-bold"
                  onClick={() => setPeriodos([...periodos, { inicio: '', fim: '' }])}
                >
                  + Adicionar período
                </Button>
              </div>
            )}

            {modo === 'diaria' && (
              <div>
                <Label className="text-xs font-bold">Quantidade de diárias</Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {['0.5', '1'].map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setDiarias(v)}
                      className={`h-11 rounded-lg border-2 text-xs font-black ${
                        diarias === v
                          ? 'border-pepsi-600 bg-prata-300/35 text-foreground'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      {v === '0.5' ? 'Meia diária' : '1 diária'}
                    </button>
                  ))}
                  <Input
                    type="number"
                    step="0.5"
                    value={diarias}
                    onChange={(e) => setDiarias(e.target.value)}
                    className="h-11 text-sm font-bold"
                  />
                </div>
              </div>
            )}

            <div className={`grid grid-cols-2 gap-3 pt-1 ${modo === 'horimetro' ? '' : 'opacity-80'}`}>
              <div>
                <Label htmlFor="hIni" className="text-xs font-bold">
                  {veiculo ? 'Km Inicial' : 'Horímetro Inicial'}
                </Label>
                <Input
                  id="hIni"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 1840.0"
                  value={horimetroInicial}
                  onChange={(e) => setHorimetroInicial(e.target.value)}
                  className="h-14 text-lg font-mono font-bold mt-1"
                />
              </div>

              <div>
                <Label htmlFor="hFim" className="text-xs font-bold">
                  {veiculo ? 'Km Final' : 'Horímetro Final'}
                </Label>
                <Input
                  id="hFim"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 1848.5"
                  value={horimetroFinal}
                  onChange={(e) => setHorimetroFinal(e.target.value)}
                  className="h-14 text-lg font-mono font-bold mt-1"
                />
              </div>
            </div>

            {/* Calculated hours card */}
            <div className="bg-prata-300/35 border-2 border-prata-400/60 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {modo === 'diaria'
                    ? 'Diárias'
                    : modo === 'horario'
                      ? 'Horas pelos horários'
                      : veiculo
                        ? 'Km Rodados'
                        : 'Horas Trabalhadas Calculadas'}
                </span>
                <div className="text-xs text-muted-foreground">
                  {modo === 'horimetro' ? 'Final menos inicial' : modo === 'horario' ? 'Soma dos períodos' : 'Meia diária = 0,5'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-pepsi-600 dark:text-pepsi-300 tracking-tight">
                  {modo === 'diaria'
                    ? numDiarias.toString().replace('.', ',')
                    : modo === 'horario'
                      ? horasPeriodos.toFixed(1).replace('.', ',') + 'h'
                      : horasCalculadas.toFixed(1).replace('.', ',') + un}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. CLIENTE E OBRA */}
        <Card className="border-2">
          <CardHeader className="p-3.5 pb-2 border-b bg-muted/40">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Local / Obra (opcional — toque de novo para desmarcar)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar obra ou cliente..."
                value={buscaObra}
                onChange={(e) => setBuscaObra(e.target.value)}
                className="pl-9 h-11 text-xs"
              />
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {obrasFiltradas.map((o) => {
                const isSelected = obraId === o.id
                const cli = clientes.find((c) => c.id === o.cliente_id)
                return (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => setObraId(isSelected ? '' : o.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-pepsi-600 bg-prata-300/35 font-bold shadow-sm'
                        : 'border-border bg-card hover:border-prata-400/60'
                    }`}
                  >
                    <div className="text-sm font-black text-foreground">{o.nome || 'Sem nome'}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Cliente:{' '}
                      <span className="font-semibold text-foreground">
                        {cli?.nome || 'Cliente'}
                      </span>
                    </div>
                    {o.endereco && (
                      <div className="text-[11px] text-muted-foreground truncate">{o.endereco}</div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 4. SERVIÇOS REALIZADOS (MULTI-SELECT) */}
        <Card className="border-2">
          <CardHeader className="p-3.5 pb-2 border-b bg-muted/40">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              4. Serviços Realizados (Marque 1 ou mais)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tiposServico.map((srv) => {
                const isChecked = servicosSelecionados.includes(srv.id)
                return (
                  <label
                    key={srv.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isChecked
                        ? 'border-pepsi-600 bg-prata-300/35 font-bold text-foreground'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleServico(srv.id)}
                      className="w-5 h-5 rounded border-2"
                    />
                    <span className="text-xs leading-snug">{srv.nome}</span>
                  </label>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 5. DETALHES, PARADAS E VIAGENS */}
        <Card className="border-2">
          <CardHeader className="p-3.5 pb-2 border-b bg-muted/40">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              5. Observações & Paradas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            <div>
              <Label htmlFor="desc" className="text-xs font-bold">
                Descrição Livre do que foi Feito
              </Label>
              <Textarea
                id="desc"
                placeholder="Ex: Escavação do aterro, nivelamento da pista e acerto do sangradouro..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="mt-1 text-sm resize-none"
              />
            </div>

            {/* Truck trips count if truck */}
            {isCaminhao && (
              <div className="p-3 rounded-xl bg-muted/50 border flex items-center gap-3">
                <Truck className="w-5 h-5 text-pepsi-500 shrink-0" />
                <div className="flex-1">
                  <Label htmlFor="viagens" className="text-xs font-bold">
                    Viagens Realizadas (Caminhão)
                  </Label>
                  <Input
                    id="viagens"
                    type="number"
                    placeholder="Ex: 15 viagens"
                    value={quantidadeViagens}
                    onChange={(e) => setQuantidadeViagens(e.target.value)}
                    className="h-10 text-sm mt-1"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <Label htmlFor="hParadas" className="text-xs font-bold">
                  Horas Paradas (opcional)
                </Label>
                <Input
                  id="hParadas"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 1.0"
                  value={horasParadas}
                  onChange={(e) => setHorasParadas(e.target.value)}
                  className="h-11 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="motivoParada" className="text-xs font-bold">
                  Motivo da Parada
                </Label>
                <Input
                  id="motivoParada"
                  placeholder="Ex: Chuva, quebra, aguardando caminhão..."
                  value={motivoParada}
                  onChange={(e) => setMotivoParada(e.target.value)}
                  className="h-11 text-sm mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. FOTOS DO SERVIÇO */}
        <Card className="border-2">
          <CardHeader className="p-3.5 pb-2 border-b bg-muted/40">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>6. Fotos ou PDFs (Opcional)</span>
              <Camera className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            <AnexoPicker
              pasta="apontamentos"
              label={`Anexar foto ou PDF (${fotosExistentes.length + fotos.length} anexado(s))`}
              onUploaded={(url) => setFotos((prev) => [...prev, url])}
            />

            {fotosExistentes.length + fotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {fotosExistentes.map((url, idx) => (
                  <AnexoThumb key={`e${idx}`} url={url} />
                ))}
                {fotos.map((url, idx) => (
                  <AnexoThumb
                    key={idx}
                    url={url}
                    onRemove={() => setFotos(fotos.filter((_, i) => i !== idx))}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-2 border-pepsi-600/60">
            <CardHeader className="p-3.5 pb-2 border-b bg-prata-300/25">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-pepsi-900 dark:text-pepsi-200">
                7. Valores e situação (admin)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 space-y-3">
              <div>
                <Label className="text-xs font-bold">Cliente</Label>
                <select
                  value={clienteManual}
                  onChange={(e) => setClienteManual(e.target.value)}
                  className="w-full h-11 text-sm font-semibold rounded-md border border-input bg-background px-3 mt-1"
                >
                  <option value="">— Do cadastro da obra —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome || 'Sem nome'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">
                    {modo === 'diaria' ? 'Valor da diária (R$)' : 'Valor por hora (R$)'}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={
                      maquinaSelecionada ? String(maquinaSelecionada.valor_hora_padrao || '') : 'Ex: 400'
                    }
                    value={valorUnit}
                    onChange={(e) => setValorUnit(e.target.value)}
                    className="h-12 text-base font-bold mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Valor total (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={valorTotalCalc.toFixed(2)}
                    value={valorTotalManual}
                    onChange={(e) => setValorTotalManual(e.target.value)}
                    className="h-12 text-base font-bold mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold">Situação</Label>
                <select
                  value={statusEdit}
                  onChange={(e) => setStatusEdit(e.target.value)}
                  disabled={!editing}
                  className="w-full h-11 text-sm font-semibold rounded-md border border-input bg-background px-3 mt-1"
                >
                  <option value="pendente">Pendente</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="devolvido">Devolvido</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BIG SAVE BUTTON */}
        <Button
          type="submit"
          disabled={salvando}
          className="w-full h-16 text-lg font-black bg-pepsi-600 hover:bg-pepsi-700 text-white shadow-xl rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wide transition-all active:scale-[0.98]"
        >
          {salvando ? (
            <span>Salvando Apontamento...</span>
          ) : (
            <>
              <CheckCircle className="w-6 h-6" />
              <span>{editing ? 'Salvar Alterações' : 'Salvar Apontamento'}</span>
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
