import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Fuel, ArrowLeft, Camera, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  getMaquinas,
  getFuncionarios,
  saveAbastecimento,
  getAbastecimentos,
} from '@/services/cambui'
import { Maquina, Funcionario, Abastecimento } from '@/types/cambui'
import { formatDateBR } from '@/lib/formatters'
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
  const [horimetroMomento, setHorimetroMomento] = useState('')
  const [tipoCombustivel, setTipoCombustivel] = useState<'diesel' | 'gasolina' | 'ARLA'>('diesel')
  const [litros, setLitros] = useState('')
  const [valorPorLitro, setValorPorLitro] = useState('5.99')
  const [valorTotal, setValorTotal] = useState('')
  const [postoLocal, setPostoLocal] = useState('Posto Parceiro Cambuí')
  const [fotoCupom, setFotoCupom] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function init() {
      const [m, f] = await Promise.all([getMaquinas(), getFuncionarios()])
      setMaquinas(m)
      setFuncionarios(f)
      if (m.length > 0) {
        setMaquinaId(m[0].id)
        setHorimetroMomento(m[0].horimetro_atual.toString())
      }
      if (f.length > 0) {
        const found = f.find((func) => func.usuario_id === user?.id)
        setFuncionarioId(found ? found.id : f[0].id)
      }
    }
    init()
  }, [user])

  // Handle auto-calc of total or per-liter
  const handleLitrosChange = (val: string) => {
    setLitros(val)
    const l = parseFloat(val) || 0
    const vpl = parseFloat(valorPorLitro) || 0
    if (l > 0 && vpl > 0) {
      setValorTotal((l * vpl).toFixed(2))
    }
  }

  const handleValorPorLitroChange = (val: string) => {
    setValorPorLitro(val)
    const l = parseFloat(litros) || 0
    const vpl = parseFloat(val) || 0
    if (l > 0 && vpl > 0) {
      setValorTotal((l * vpl).toFixed(2))
    }
  }

  const handleValorTotalChange = (val: string) => {
    setValorTotal(val)
    const tot = parseFloat(val) || 0
    const l = parseFloat(litros) || 0
    if (tot > 0 && l > 0) {
      setValorPorLitro((tot / l).toFixed(3))
    }
  }

  const handleSelectMaquina = (mId: string) => {
    setMaquinaId(mId)
    const m = maquinas.find((x) => x.id === mId)
    if (m) {
      setHorimetroMomento(m.horimetro_atual.toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const l = parseFloat(litros) || 0
    const vt = parseFloat(valorTotal) || 0
    const hor = parseFloat(horimetroMomento) || 0

    if (!maquinaId || l <= 0 || vt <= 0 || hor <= 0) {
      toast.error('Preencha os campos obrigatórios (máquina, horímetro, litros e valor).')
      return
    }

    setSalvando(true)
    try {
      const res = await saveAbastecimento({
        data,
        maquina_id: maquinaId,
        funcionario_id: funcionarioId || (funcionarios[0]?.id ?? ''),
        horimetro_momento: hor,
        tipo_combustivel: tipoCombustivel,
        litros: l,
        valor_por_litro: parseFloat(valorPorLitro) || null,
        valor_total: vt,
        posto_local: postoLocal,
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
          <CardHeader className="p-3.5 pb-2 border-b bg-amber-500/10">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <span>Máquina & Combustível</span>
              <Fuel className="w-4 h-4 text-amber-500" />
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
              <Label className="text-xs font-bold">Máquina Abastecida</Label>
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
              <Label className="text-xs font-bold">Horímetro no Momento do Abastecimento</Label>
              <Input
                type="number"
                step="0.1"
                value={horimetroMomento}
                onChange={(e) => setHorimetroMomento(e.target.value)}
                placeholder="Ex: 1845.5"
                className="h-12 font-mono text-base font-bold mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Litros Abastecidos *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={litros}
                  onChange={(e) => handleLitrosChange(e.target.value)}
                  placeholder="Ex: 180"
                  className="h-12 text-base font-bold mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Valor por Litro (R$)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={valorPorLitro}
                  onChange={(e) => handleValorPorLitroChange(e.target.value)}
                  placeholder="5.99"
                  className="h-12 text-sm mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Valor Total Pago / Nota (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={valorTotal}
                onChange={(e) => handleValorTotalChange(e.target.value)}
                placeholder="Ex: 1078.20"
                className="h-14 text-xl font-mono font-black text-amber-600 mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Posto ou Comboio</Label>
              <Input
                value={postoLocal}
                onChange={(e) => setPostoLocal(e.target.value)}
                placeholder="Ex: Posto Petrobras Fernão Dias ou Comboio de campo"
                className="h-11 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Foto do Cupom / Nota (Opcional)</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFotoCupom('https://img.usecurling.com/p/600/800?q=fuel%20receipt&color=white')
                  toast.success('Cupom fiscal anexado!')
                }}
                className="w-full h-11 text-xs font-bold gap-2 border-dashed mt-1"
              >
                <Camera className="w-4 h-4 text-amber-500" />
                {fotoCupom ? 'Foto do Cupom Anexada' : 'Tirar Foto do Cupom / Nota'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={salvando}
          className="w-full h-16 text-lg font-black bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-2xl gap-2 shadow-lg uppercase"
        >
          <CheckCircle2 className="w-6 h-6" />
          Salvar Abastecimento
        </Button>
      </form>
    </div>
  )
}
