import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react'
import {
  getMaquinas,
  getObras,
  getClientes,
  getFuncionarios,
  getTiposServico,
  saveApontamento,
} from '@/services/cambui'
import { processarFotoFolhaIA, LeituraFolhaResultado } from '@/services/ocr-vision'
import { Maquina, Obra, Cliente, Funcionario, TipoServico } from '@/types/cambui'
import { toast } from 'sonner'
import { AnexoPicker, AnexoThumb } from '@/components/shared/AnexoPicker'
import { isPdfUrl } from '@/services/cambui'
import { nomeEquipamento, isVeiculo } from '@/lib/formatters'

interface FotoFolhaViewProps {
  onBack: () => void
  onSuccess: () => void
}

export const FotoFolhaView: React.FC<FotoFolhaViewProps> = ({ onBack, onSuccess }) => {
  const { usuario, user } = useAuth()

  const [etapa, setEtapa] = useState<'captura' | 'processando' | 'conferencia'>('captura')
  const [fotoUrl, setFotoUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([])

  // Extracted values for conference screen
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [funcionarioId, setFuncionarioId] = useState('')
  const [maquinaId, setMaquinaId] = useState('')
  const [obraId, setObraId] = useState('')
  const [horimetroInicial, setHorimetroInicial] = useState('')
  const [horimetroFinal, setHorimetroFinal] = useState('')
  const [servicosIds, setServicosIds] = useState<string[]>([])
  const [descricao, setDescricao] = useState('')
  const [confiancaCampos, setConfiancaCampos] = useState<
    LeituraFolhaResultado['confiancaCampos'] | null
  >(null)

  useEffect(() => {
    async function init() {
      const [m, o, c, f, s] = await Promise.all([
        getMaquinas(),
        getObras(),
        getClientes(),
        getFuncionarios(),
        getTiposServico(),
      ])
      setMaquinas(m)
      setObras(o)
      setClientes(c)
      setFuncionarios(f)
      setTiposServico(s)
    }
    init()
  }, [])

  const handleArquivoEnviado = async (url: string, tipo: 'foto' | 'pdf') => {
    setFotoUrl(url)
    if (tipo === 'pdf') {
      // PDF: vai direto para a conferência, campos em branco para preencher
      toast.info('PDF salvo! Preencha os dados que quiser (todos opcionais).')
      setEtapa('conferencia')
      return
    }
    await handleSimularCaptura(url)
  }

  const handleSimularCaptura = async (url: string) => {
    setEtapa('processando')
    setLoading(true)

    try {
      // Simulate OCR vision processing
      const resultado = await processarFotoFolhaIA(url, {
        funcionarios,
        maquinas,
        clientes,
        obras,
        tiposServico,
      })

      setData(resultado.dados.data)
      setFuncionarioId(resultado.dados.funcionarioId || '')
      setMaquinaId(resultado.dados.maquinaId || '')
      setObraId(resultado.dados.obraId || '')
      setHorimetroInicial(resultado.dados.horimetroInicial.toString())
      setHorimetroFinal(resultado.dados.horimetroFinal.toString())
      setServicosIds(resultado.dados.servicosIds)
      setDescricao(resultado.dados.descricao)
      setConfiancaCampos(resultado.confiancaCampos)

      toast.success('Folha lida com sucesso! Confira os dados abaixo.')
      setEtapa('conferencia')
    } catch {
      toast.error('Não foi possível ler todos os campos. O apontamento irá como rascunho de foto.')
      setEtapa('conferencia')
    } finally {
      setLoading(false)
    }
  }

  const handleSalvarConferencia = async (comoRascunho: boolean = false) => {
    setLoading(true)
    try {
      const obraSel = obras.find((o) => o.id === obraId)
      const hIni = parseFloat(horimetroInicial) || 0
      const hFim = parseFloat(horimetroFinal) || 0
      const temMedicao = horimetroInicial !== '' && horimetroFinal !== '' && hFim > hIni
      const maqSel = maquinas.find((m) => m.id === maquinaId)

      const res = await saveApontamento(
        {
          data,
          funcionario_id: funcionarioId || null,
          maquina_id: maquinaId || null,
          cliente_id: obraSel?.cliente_id || null,
          obra_id: obraId || null,
          horimetro_inicial: horimetroInicial === '' ? null : hIni,
          horimetro_final: horimetroFinal === '' ? null : hFim,
          horas_trabalhadas:
            temMedicao && !isVeiculo(maqSel) ? Number((hFim - hIni).toFixed(1)) : null,
          descricao,
          status: comoRascunho ? 'rascunho_foto' : 'pendente',
          origem_foto: true,
          foto_folha_url: fotoUrl || null,
        },
        servicosIds,
        fotoUrl ? [fotoUrl] : [],
      )

      if (comoRascunho) {
        toast.info('Salvo como Rascunho de Foto na fila de digitação do admin.')
      } else {
        toast.success('Apontamento de folha conferido e enviado para aprovação!')
      }
      onSuccess()
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + (e.message || 'Tente novamente'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pb-16 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">ENVIAR FOTO OU PDF</h2>
          <p className="text-xs text-muted-foreground">
            Digitalização com tela de conferência inteligente
          </p>
        </div>
      </div>

      {etapa === 'captura' && (
        <Card className="border-2 shadow-sm">
          <CardHeader className="p-4 pb-2 border-b bg-muted/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Camera className="w-4 h-4 text-pepsi-500" />
              Enviar Folha do Dia (Foto ou PDF)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-center">
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-2xl p-6 bg-muted/20 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-prata-300/45 flex items-center justify-center">
                <FileText className="w-8 h-8 text-pepsi-600 dark:text-pepsi-300" />
              </div>
              <div className="text-sm font-bold">Escolha se vai enviar uma foto ou um PDF</div>
              <p className="text-xs text-muted-foreground max-w-xs">
                O arquivo fica salvo no sistema junto com o lançamento.
              </p>
            </div>

            <AnexoPicker
              pasta="folhas"
              label="Enviar foto ou PDF"
              onUploaded={handleArquivoEnviado}
            />
          </CardContent>
        </Card>
      )}

      {etapa === 'processando' && (
        <Card className="border-2 p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-prata-300/45 flex items-center justify-center animate-spin">
            <RefreshCw className="w-8 h-8 text-pepsi-600 dark:text-pepsi-300" />
          </div>
          <h3 className="text-lg font-black">Processando imagem da folha...</h3>
          <p className="text-xs text-muted-foreground">
            Identificando texto manuscrito, casando nomes com cadastros de obras e máquinas...
          </p>
        </Card>
      )}

      {etapa === 'conferencia' && (
        <div className="space-y-4">
          {/* Top highlight warning */}
          <div className="p-3 bg-prata-300/45 border border-pepsi-600 rounded-xl text-xs text-pepsi-950 dark:text-pepsi-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-pepsi-600 dark:text-pepsi-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tela de Conferência do Apontamento</p>
              <p className="mt-0.5 opacity-90">
                Os campos foram pré-preenchidos. Campos marcados em{' '}
                <span className="font-bold underline">amarelo</span> tiveram baixa confiança ou
                precisam de conferência visual. A foto original está anexada.
              </p>
            </div>
          </div>

          {/* Side-by-side or stacked photo thumbnail */}
          <div className="border rounded-xl p-3 bg-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {fotoUrl && <AnexoThumb url={fotoUrl} size="w-14 h-14" />}
              <div>
                <span className="text-xs font-bold text-foreground">
                  {isPdfUrl(fotoUrl) ? 'PDF Anexado' : 'Foto Original Anexada'}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Ficha de campo arquivada no apontamento
                </p>
              </div>
            </div>
            {!isPdfUrl(fotoUrl) && (
              <Badge
                variant="outline"
                className="text-xs border-pepsi-600 text-pepsi-600 dark:text-pepsi-300"
              >
                85% confiança
              </Badge>
            )}
          </div>

          {/* Form fields with confidence highlights */}
          <Card className="border-2">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={
                    confiancaCampos?.data === 'baixa'
                      ? 'p-1.5 bg-yellow-200/40 dark:bg-yellow-900/30 rounded-lg border border-yellow-500'
                      : ''
                  }
                >
                  <Label className="text-xs font-bold">Data Extraída</Label>
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="h-11 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold">Operador</Label>
                  <select
                    value={funcionarioId}
                    onChange={(e) => setFuncionarioId(e.target.value)}
                    className="w-full h-11 text-xs rounded-md border border-input bg-background px-2.5 mt-1"
                  >
                    <option value="">— Não informado —</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome || 'Sem nome'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Máquina / Veículo</Label>
                <select
                  value={maquinaId}
                  onChange={(e) => setMaquinaId(e.target.value)}
                  className="w-full h-11 text-xs rounded-md border border-input bg-background px-2.5 mt-1"
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

              {/* Obra matching highlight */}
              <div
                className={
                  confiancaCampos?.clienteObra === 'media'
                    ? 'p-2 bg-yellow-200/40 dark:bg-yellow-900/30 rounded-lg border border-yellow-500'
                    : ''
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-bold">Local / Obra (Casamento Aproximado)</Label>
                  <span className="text-[10px] text-pepsi-700 dark:text-pepsi-300 font-semibold">
                    Conferir
                  </span>
                </div>
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  className="w-full h-11 text-xs rounded-md border border-input bg-background px-2.5"
                >
                  <option value="">— Não informado —</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome || 'Sem nome'} (Cliente: {o.cliente?.nome || '—'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">
                    {isVeiculo(maquinas.find((m) => m.id === maquinaId))
                      ? 'Km Inicial'
                      : 'Horímetro Inicial'}
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={horimetroInicial}
                    onChange={(e) => setHorimetroInicial(e.target.value)}
                    className="h-11 font-mono text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">
                    {isVeiculo(maquinas.find((m) => m.id === maquinaId))
                      ? 'Km Final'
                      : 'Horímetro Final'}
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={horimetroFinal}
                    onChange={(e) => setHorimetroFinal(e.target.value)}
                    className="h-11 font-mono text-sm mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Descrição Extraída</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => handleSalvarConferencia(false)}
              disabled={loading}
              className="w-full h-16 text-base font-black bg-pepsi-600 hover:bg-pepsi-700 text-white rounded-xl gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5" />
              CONFIRMAR E SALVAR APONTAMENTO
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSalvarConferencia(true)}
              disabled={loading}
              className="w-full h-12 text-xs font-bold border-dashed"
            >
              Não consegui conferir tudo: Salvar como "Rascunho de Foto"
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
