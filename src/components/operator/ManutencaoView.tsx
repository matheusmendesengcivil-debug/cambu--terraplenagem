import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Wrench,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Droplets,
} from 'lucide-react'
import { getMaquinas, saveManutencao, getManutencoes } from '@/services/cambui'
import { Maquina, Manutencao } from '@/types/cambui'
import { formatDateBR, formatCurrency } from '@/lib/formatters'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface ManutencaoViewProps {
  onBack: () => void
  onSuccess: () => void
}

export const ManutencaoView: React.FC<ManutencaoViewProps> = ({ onBack, onSuccess }) => {
  const { isAdmin } = useAuth()
  const [aba, setAba] = useState<'lancar' | 'alertas' | 'historico'>('alertas')
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [historico, setHistorico] = useState<Manutencao[]>([])
  const [salvando, setSalvando] = useState(false)

  // Form states
  const hoje = new Date().toISOString().split('T')[0]
  const [data, setData] = useState(hoje)
  const [maquinaId, setMaquinaId] = useState('')
  const [horimetro, setHorimetro] = useState('')
  const [tipo, setTipo] = useState<Manutencao['tipo']>('troca de óleo do motor')
  const [descricao, setDescricao] = useState('')
  const [custo, setCusto] = useState('')
  const [oficina, setOficina] = useState('')

  const carregarDados = async () => {
    const [m, h] = await Promise.all([getMaquinas(), getManutencoes()])
    setMaquinas(m)
    setHistorico(h)
    if (m.length > 0 && !maquinaId) {
      setMaquinaId(m[0].id)
      setHorimetro(m[0].horimetro_atual.toString())
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleSelectMaquina = (mId: string) => {
    setMaquinaId(mId)
    const m = maquinas.find((x) => x.id === mId)
    if (m) {
      setHorimetro(m.horimetro_atual.toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const hor = parseFloat(horimetro) || 0
    if (!maquinaId || hor <= 0 || !descricao) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }

    setSalvando(true)
    try {
      const res = await saveManutencao({
        data,
        maquina_id: maquinaId,
        horimetro: hor,
        tipo,
        descricao,
        custo: custo ? parseFloat(custo) : 0,
        oficina_responsavel: oficina || null,
      })

      if (res.offline) {
        toast.warning('Manutenção salva no aparelho (OFFLINE)!')
      } else {
        toast.success('Manutenção registrada com sucesso!')
      }
      await carregarDados()
      setAba('historico')
      onSuccess()
    } catch (err: any) {
      toast.error('Erro ao salvar manutenção: ' + (err.message || 'Tente novamente'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4 pb-16 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">
            MANUTENÇÃO & TROCA DE ÓLEO
          </h2>
          <p className="text-xs text-muted-foreground">
            Alertas de horímetro e histórico preventivo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setAba('alertas')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            aba === 'alertas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Alertas de Óleo
        </button>
        <button
          onClick={() => setAba('lancar')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            aba === 'lancar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Lançar Novo
        </button>
        <button
          onClick={() => setAba('historico')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            aba === 'historico' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Histórico
        </button>
      </div>

      {/* 1. ALERTAS DE TROCA DE ÓLEO */}
      {aba === 'alertas' && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground px-1 font-semibold">
            Status do intervalo de troca de óleo de cada máquina:
          </div>

          {maquinas.map((m) => {
            const hAtual = Number(m.horimetro_atual || 0)
            const hUltima = Number(m.horimetro_ultima_troca || 0)
            const intervalo = Number(m.intervalo_troca_oleo || 250)
            const horasRodadas = hAtual - hUltima
            const horasRestantes = intervalo - horasRodadas
            const atrasada = horasRestantes < 0
            const proxima = horasRestantes >= 0 && horasRestantes <= 50

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  atrasada
                    ? 'border-red-500 bg-red-500/10'
                    : proxima
                      ? 'border-pepsi-600 bg-prata-300/25'
                      : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {m.tipo} - {m.modelo}
                    </h3>
                    <p className="text-xs text-muted-foreground">{m.placa_identificacao}</p>
                  </div>
                  {atrasada ? (
                    <Badge variant="destructive" className="gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Atrasada {Math.abs(horasRestantes).toFixed(1)}h!
                    </Badge>
                  ) : proxima ? (
                    <Badge className="bg-pepsi-600 text-white font-bold gap-1">
                      <Clock className="w-3 h-3" />
                      Troca em {horasRestantes.toFixed(1)}h
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500">
                      Em dia ({horasRestantes.toFixed(1)}h restantes)
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-border/50 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Horímetro Atual:</span>
                    <div className="font-bold font-mono text-xs">{hAtual}h</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última Troca:</span>
                    <div className="font-bold font-mono text-xs">{hUltima}h</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intervalo:</span>
                    <div className="font-bold font-mono text-xs">{intervalo}h</div>
                  </div>
                </div>

                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={atrasada ? 'destructive' : 'outline'}
                    onClick={() => {
                      setMaquinaId(m.id)
                      setHorimetro(hAtual.toString())
                      setTipo('troca de óleo do motor')
                      setDescricao(
                        `Troca de óleo do motor com ${hAtual}h e substituição de filtros`,
                      )
                      setAba('lancar')
                    }}
                    className="w-full h-9 text-xs font-bold gap-1.5"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    Registrar Troca de Óleo Nesta Máquina
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. FORMULÁRIO LANÇAR MANUTENÇÃO */}
      {aba === 'lancar' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-2 shadow-sm">
            <CardHeader className="p-3.5 pb-2 border-b bg-prata-300/25">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-pepsi-900 dark:text-pepsi-200">
                Dados da Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">Data</Label>
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="h-11 text-xs mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Tipo da Manutenção *</Label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full h-11 text-xs rounded-md border border-input bg-background px-2.5 mt-1 font-semibold"
                    required
                  >
                    <option value="troca de óleo do motor">Troca de óleo do motor</option>
                    <option value="óleo hidráulico">Óleo hidráulico</option>
                    <option value="filtros">Filtros</option>
                    <option value="graxa/lubrificação">Graxa/lubrificação</option>
                    <option value="pneus">Pneus</option>
                    <option value="peças">Peças</option>
                    <option value="conserto">Conserto</option>
                    <option value="revisão">Revisão completa</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Máquina</Label>
                <select
                  value={maquinaId}
                  onChange={(e) => handleSelectMaquina(e.target.value)}
                  className="w-full h-12 text-sm font-bold rounded-md border border-input bg-background px-3 mt-1"
                  required
                >
                  {maquinas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.tipo} - {m.modelo} ({m.placa_identificacao})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold">Horímetro no Momento do Serviço *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={horimetro}
                  onChange={(e) => setHorimetro(e.target.value)}
                  placeholder="Ex: 1845.5"
                  className="h-12 font-mono text-base font-bold mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Descrição dos Serviços e Peças *</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Troca de 25L de óleo 15W40, filtro de óleo e filtro de ar..."
                  rows={3}
                  className="mt-1 text-sm resize-none"
                  required
                />
              </div>

              {/* Custos (Admin vê ou preenche, operador opcional) */}
              {isAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold">Custo Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={custo}
                      onChange={(e) => setCusto(e.target.value)}
                      placeholder="Ex: 1450.00"
                      className="h-11 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Oficina / Mecânico</Label>
                    <Input
                      value={oficina}
                      onChange={(e) => setOficina(e.target.value)}
                      placeholder="Ex: Oficina TratorSul"
                      className="h-11 text-xs mt-1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={salvando}
            className="w-full h-16 text-lg font-black bg-pepsi-600 hover:bg-pepsi-700 text-white rounded-2xl gap-2 shadow-lg uppercase"
          >
            <CheckCircle2 className="w-6 h-6" />
            Salvar Registro
          </Button>
        </form>
      )}

      {/* 3. HISTÓRICO */}
      {aba === 'historico' && (
        <div className="space-y-3">
          {historico.length === 0 ? (
            <div className="p-8 text-center border rounded-xl text-xs text-muted-foreground">
              Nenhuma manutenção registrada.
            </div>
          ) : (
            historico.map((m) => (
              <div key={m.id} className="p-3 border rounded-xl bg-card space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{formatDateBR(m.data)}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {m.tipo}
                  </Badge>
                </div>
                <div className="text-sm font-bold text-foreground">
                  {m.maquina?.modelo || 'Máquina'} ({m.horimetro}h)
                </div>
                <p className="text-xs text-muted-foreground">{m.descricao}</p>
                {isAdmin && m.custo > 0 && (
                  <div className="text-xs font-bold text-pepsi-600 dark:text-pepsi-300 pt-1">
                    Custo: {formatCurrency(m.custo)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
