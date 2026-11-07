import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Fuel, ArrowLeft, CheckCircle2, Edit2, Home } from 'lucide-react'
import {
  getMaquinas,
  getFuncionarios,
  saveAbastecimento,
  getAbastecimentos,
  getApontamentos,
} from '@/services/cambui'
import { Maquina, Funcionario, Abastecimento } from '@/types/cambui'
import { isVeiculo, nomeEquipamento } from '@/lib/formatters'
import { AnexoPicker, AnexoThumb } from '@/components/shared/AnexoPicker'
import { toast } from 'sonner'

interface AbastecimentoFormProps {
  onBack: () => void
  onSuccess: () => void
}

export const AbastecimentoForm: React.FC<AbastecimentoFormProps> = ({ onBack, onSuccess }) => {
  const { usuario, user } = useAuth()

  const hoje = new Date().toISOString().split('T')[0]
  const [data, setData] = useState(hoje)
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])

  const [maquinaId, setMaquinaId] = useState('')
  const [funcionarioId, setFuncionarioId] = useState('')
  const [editandoFrentista, setEditandoFrentista] = useState(false)
  const [operadorId, setOperadorId] = useState('')
  const [ultimosOperadores, setUltimosOperadores] = useState<Record<string, string>>({})
  const [tipoCombustivel, setTipoCombustivel] = useState<'diesel' | 'gasolina' | 'ARLA'>('diesel')
  const [litros, setLitros] = useState('')
  const [postoLocal, setPostoLocal] = useState('Garagem')
  const [editandoLocal, setEditandoLocal] = useState(false)
  const [fotoCupom, setFotoCupom] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function init() {
      const [m, f] = await Promise.all([getMaquinas(), getFuncionarios()])
      setMaquinas(m)
      setFuncionarios(f)
      const found = f.find((func) => func.usuario_id === user?.id)
      if (found) setFuncionarioId(found.id)
      try {
        const aps = await getApontamentos()
        const mapa: Record<string, string> = {}
        for (const a of aps) {
          if (a.maquina_id && a.funcionario_id && !mapa[a.maquina_id]) mapa[a.maquina_id] = a.funcionario_id
        }
        setUltimosOperadores(mapa)
      } catch {}
    }
    init()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const l = litros === '' ? null : parseFloat(litros)

    setSalvando(true)
    try {
      const res = await saveAbastecimento({
        data,
        maquina_id: maquinaId || null,
        funcionario_id: funcionarioId || null,
        operador_id: operadorId || null,
        tipo_combustivel: tipoCombustivel,
        litros: l,
        posto_local: postoLocal.trim() || 'Garagem',
        foto_cupom_url: fotoCupom,
      })

      if (res.offline) {
        toast.warning('Abastecimento salvo no aparelho (OFFLINE)!')
      } else {
        toast.success('Abastecimento registrado com sucesso!')
      }
      onSuccess()
    } catch (err: any) {
      toast.error('Erro ao salvar abastecimento: ' + (err.message || 'Tente novamente'))
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
            LANÇAR ABASTECIMENTO
          </h2>
          <p className="text-xs text-muted-foreground">
            Registro de combustível e cupom de abastecimento
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-2 shadow-sm">
          <CardHeader className="p-3.5 pb-2 border-b bg-prata-300/25">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-pepsi-900 dark:text-pepsi-200 flex items-center justify-between">
              <span>Máquina / Veículo & Combustível</span>
              <Fuel className="w-4 h-4 text-pepsi-500" />
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
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Tipo</Label>
                <select
                  value={tipoCombustivel}
                  onChange={(e) => setTipoCombustivel(e.target.value as any)}
                  className="w-full h-11 text-xs rounded-md border border-input bg-background px-2.5 mt-1 font-semibold"
                >
                  <option value="diesel">Diesel S-10</option>
                  <option value="gasolina">Gasolina Comum</option>
                  <option value="ARLA">ARLA 32</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Máquina / Veículo Abastecido</Label>
              <select
                value={maquinaId}
                onChange={(e) => {
                  setMaquinaId(e.target.value)
                  const op = ultimosOperadores[e.target.value]
                  if (op) setOperadorId(op)
                }}
                className="w-full h-12 text-sm font-bold rounded-md border border-input bg-background px-3 mt-1"
              >
                <option value="">— Não informado —</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {isVeiculo(m) ? '🚚 ' : '🚜 '}
                    {nomeEquipamento(m)}
                    {m.placa_identificacao ? ` (${m.placa_identificacao})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold">Operador da máquina / veículo</Label>
              <select
                value={operadorId}
                onChange={(e) => setOperadorId(e.target.value)}
                className="w-full h-12 text-sm font-bold rounded-md border border-input bg-background px-3 mt-1"
              >
                <option value="">— Não informado —</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome || 'Sem nome'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold">Quem abasteceu</Label>
              {editandoFrentista ? (
                <select
                  autoFocus
                  value={funcionarioId}
                  onChange={(e) => {
                    setFuncionarioId(e.target.value)
                    setEditandoFrentista(false)
                  }}
                  className="w-full h-11 text-sm font-bold rounded-md border border-input bg-background px-3 mt-1"
                >
                  <option value="">— Não informado —</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome || 'Sem nome'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center justify-between h-11 mt-1 px-3 rounded-md border bg-muted/40">
                  <span className="text-sm font-bold">
                    {funcionarios.find((f) => f.id === funcionarioId)?.nome ||
                      usuario?.nome ||
                      'Não informado'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditandoFrentista(true)}
                    className="h-8 text-xs gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold">Litros Abastecidos</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                placeholder="Ex: 180"
                className="h-14 text-xl font-mono font-black text-pepsi-600 dark:text-pepsi-300 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Local do Abastecimento</Label>
              {editandoLocal ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    autoFocus
                    value={postoLocal}
                    onChange={(e) => setPostoLocal(e.target.value)}
                    placeholder="Ex: Posto Petrobras, comboio..."
                    className="h-11 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPostoLocal('Garagem')
                      setEditandoLocal(false)
                    }}
                    className="h-11 text-xs shrink-0 gap-1"
                  >
                    <Home className="w-3.5 h-3.5" /> Garagem
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between h-11 mt-1 px-3 rounded-md border bg-muted/40">
                  <span className="text-sm font-bold">{postoLocal}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditandoLocal(true)}
                    className="h-8 text-xs gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold">Cupom / Nota (Opcional)</Label>
              <div className="mt-1 space-y-2">
                {fotoCupom ? (
                  <div className="flex items-center gap-2">
                    <AnexoThumb url={fotoCupom} onRemove={() => setFotoCupom(null)} />
                    <span className="text-xs text-muted-foreground">Cupom anexado</span>
                  </div>
                ) : (
                  <AnexoPicker
                    pasta="abastecimentos"
                    label="Anexar foto ou PDF do cupom"
                    onUploaded={(url) => setFotoCupom(url)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={salvando}
          className="w-full h-16 text-lg font-black bg-pepsi-600 hover:bg-pepsi-700 text-white rounded-2xl gap-2 shadow-lg uppercase"
        >
          <CheckCircle2 className="w-6 h-6" />
          Salvar Abastecimento
        </Button>
      </form>
    </div>
  )
}
