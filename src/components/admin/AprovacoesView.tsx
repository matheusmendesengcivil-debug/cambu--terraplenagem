import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Eye,
  Camera,
  MessageSquare,
  Search,
  Filter,
  Check,
} from 'lucide-react'
import { getApontamentos, updateApontamentoStatus } from '@/services/cambui'
import { Apontamento } from '@/types/cambui'
import { formatDateBR, formatHoursShort, formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'

export const AprovacoesView: React.FC = () => {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'pendente' | 'todos' | 'rascunho_foto'>('pendente')
  const [busca, setBusca] = useState('')

  // Dialog for return/reject comment
  const [modalDevolver, setModalDevolver] = useState<Apontamento | null>(null)
  const [motivoDevolucao, setMotivoDevolucao] = useState('')
  const [processando, setProcessando] = useState(false)

  // Modal to inspect full details & sheet photo
  const [detalhesApontamento, setDetalhesApontamento] = useState<Apontamento | null>(null)

  const carregar = async () => {
    setLoading(true)
    try {
      const data = await getApontamentos()
      setApontamentos(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleAprovar = async (ap: Apontamento) => {
    setProcessando(true)
    try {
      const { error } = await updateApontamentoStatus(ap.id, 'aprovado')
      if (error) throw error
      toast.success(
        `Apontamento #${ap.id.substring(0, 6)} aprovado! Horas liberadas para faturamento.`,
      )
      await carregar()
      if (detalhesApontamento?.id === ap.id) setDetalhesApontamento(null)
    } catch (e: any) {
      toast.error('Erro ao aprovar: ' + e.message)
    } finally {
      setProcessando(false)
    }
  }

  const handleConfirmarDevolucao = async () => {
    if (!modalDevolver) return
    if (!motivoDevolucao.trim()) {
      toast.error('Informe o motivo da devolução para que o operador corrija.')
      return
    }

    setProcessando(true)
    try {
      const { error } = await updateApontamentoStatus(
        modalDevolver.id,
        'devolvido',
        motivoDevolucao,
      )
      if (error) throw error
      toast.info('Apontamento devolvido ao operador com o comentário.')
      setModalDevolver(null)
      setMotivoDevolucao('')
      await carregar()
      if (detalhesApontamento?.id === modalDevolver.id) setDetalhesApontamento(null)
    } catch (e: any) {
      toast.error('Erro ao devolver: ' + e.message)
    } finally {
      setProcessando(false)
    }
  }

  const filtrados = apontamentos.filter((a) => {
    if (filtro === 'pendente' && a.status !== 'pendente' && a.status !== 'rascunho_foto')
      return false
    if (filtro === 'rascunho_foto' && a.status !== 'rascunho_foto') return false
    if (busca) {
      const q = busca.toLowerCase()
      const func = (a.funcionario?.nome || '').toLowerCase()
      const maq = (a.maquina?.modelo || '').toLowerCase()
      const obr = (a.obra?.nome || '').toLowerCase()
      return func.includes(q) || maq.includes(q) || obr.includes(q)
    }
    return true
  })

  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            APROVAÇÃO DE APONTAMENTOS
          </h2>
          <p className="text-xs text-muted-foreground">
            Apenas apontamentos aprovados entram no faturamento e cobrança de clientes
          </p>
        </div>

        {/* Filters */}
        <div className="flex p-1 bg-muted rounded-xl text-xs font-bold self-start">
          <button
            onClick={() => setFiltro('pendente')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filtro === 'pendente' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Pendentes (
            {
              apontamentos.filter((a) => a.status === 'pendente' || a.status === 'rascunho_foto')
                .length
            }
            )
          </button>
          <button
            onClick={() => setFiltro('rascunho_foto')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filtro === 'rascunho_foto' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Rascunhos de Foto ({apontamentos.filter((a) => a.status === 'rascunho_foto').length})
          </button>
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filtro === 'todos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Todos ({apontamentos.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Buscar por operador, máquina ou obra..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-10 text-xs"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">Carregando lista...</div>
      ) : filtrados.length === 0 ? (
        <div className="p-8 text-center border rounded-xl bg-card text-xs text-muted-foreground">
          Nenhum apontamento pendente de conferência no momento.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((ap) => (
            <Card
              key={ap.id}
              className="border-2 hover:border-prata-400/70 transition-colors shadow-sm"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {formatDateBR(ap.data)}
                    </span>
                    {ap.status === 'aprovado' ? (
                      <Badge className="bg-emerald-600 text-[10px]">Aprovado</Badge>
                    ) : ap.status === 'devolvido' ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Devolvido
                      </Badge>
                    ) : ap.status === 'rascunho_foto' ? (
                      <Badge
                        variant="secondary"
                        className="bg-purple-600/20 text-purple-700 text-[10px]"
                      >
                        Rascunho de Foto
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-pepsi-600 text-pepsi-600 dark:text-pepsi-300 text-[10px]"
                      >
                        Pendente
                      </Badge>
                    )}
                    {ap.foto_folha_url && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Camera className="w-3 h-3" /> Foto Anexa
                      </Badge>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-pepsi-600 dark:text-pepsi-300">
                      {formatHoursShort(ap.horas_trabalhadas)}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground ml-2">
                      ({formatCurrency(ap.valor_total)})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg">
                  <div>
                    <span className="text-muted-foreground font-semibold">Operador:</span>
                    <div className="font-bold text-foreground">
                      {ap.funcionario?.nome || 'Operador'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Máquina:</span>
                    <div className="font-bold text-foreground">
                      {ap.maquina?.tipo} ({ap.maquina?.modelo})
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Cliente & Obra:</span>
                    <div className="font-bold text-foreground truncate">
                      {ap.cliente?.nome} - {ap.obra?.nome}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <div className="font-mono">
                    Horímetro:{' '}
                    <span className="font-bold text-foreground">{ap.horimetro_inicial}h</span> →{' '}
                    <span className="font-bold text-foreground">{ap.horimetro_final}h</span>
                    {ap.horas_paradas ? (
                      <span className="text-pepsi-600 dark:text-pepsi-300 ml-2">
                        ({ap.horas_paradas}h paradas: {ap.motivo_parada})
                      </span>
                    ) : null}
                  </div>

                  {ap.quantidade_viagens ? (
                    <span className="font-bold text-foreground">
                      🚛 {ap.quantidade_viagens} viagens
                    </span>
                  ) : null}
                </div>

                {ap.descricao && (
                  <p className="text-xs text-muted-foreground italic border-t pt-2">
                    "{ap.descricao}"
                  </p>
                )}

                {/* Return reason if returned */}
                {ap.motivo_devolucao && (
                  <div className="text-xs text-red-600 bg-red-500/10 p-2 rounded-lg">
                    Devolvido: {ap.motivo_devolucao}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetalhesApontamento(ap)}
                    className="text-xs font-semibold h-9 gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver Detalhes / Foto
                  </Button>

                  {ap.status !== 'aprovado' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModalDevolver(ap)
                          setMotivoDevolucao('')
                        }}
                        className="text-xs font-semibold h-9 text-red-600 border-red-500/30 hover:bg-red-500/10 gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Devolver
                      </Button>

                      <Button
                        size="sm"
                        disabled={processando}
                        onClick={() => handleAprovar(ap)}
                        className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4" /> Aprovar para Faturamento
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL RETURN / DEVOLVER */}
      {modalDevolver && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-fade-in-up">
            <div>
              <h3 className="text-lg font-black text-foreground">
                Devolver Apontamento ao Operador
              </h3>
              <p className="text-xs text-muted-foreground">
                Informe o que deve ser ajustado para que o operador corrija no aplicativo.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-xl text-xs space-y-1">
              <div>
                <strong>Operador:</strong> {modalDevolver.funcionario?.nome}
              </div>
              <div>
                <strong>Data:</strong> {formatDateBR(modalDevolver.data)}
              </div>
              <div>
                <strong>Horímetro:</strong> {modalDevolver.horimetro_inicial}h a{' '}
                {modalDevolver.horimetro_final}h
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Motivo da Devolução *</Label>
              <Textarea
                value={motivoDevolucao}
                onChange={(e) => setMotivoDevolucao(e.target.value)}
                placeholder="Ex: Horímetro final divergente da foto da folha. Favor conferir e reenviar."
                rows={3}
                className="mt-1 text-xs"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalDevolver(null)}
                className="text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={processando}
                onClick={handleConfirmarDevolucao}
                className="text-xs font-bold"
              >
                Confirmar Devolução
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INSPECT / FOTO DA FOLHA */}
      {detalhesApontamento && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border-2 rounded-2xl p-5 max-w-xl w-full space-y-4 shadow-2xl my-auto animate-fade-in-up">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-foreground">Conferência de Apontamento</h3>
                <p className="text-xs text-muted-foreground">
                  {formatDateBR(detalhesApontamento.data)} • {detalhesApontamento.funcionario?.nome}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDetalhesApontamento(null)}>
                ✕
              </Button>
            </div>

            {/* If photo attached, display */}
            {detalhesApontamento.foto_folha_url && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">
                  Foto Original da Folha / Serviço:
                </span>
                <div className="rounded-xl overflow-hidden border max-h-72 bg-black flex items-center justify-center">
                  <img
                    src={detalhesApontamento.foto_folha_url}
                    alt="Folha original"
                    className="max-h-72 w-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-xl">
              <div>
                <span className="text-muted-foreground">Máquina:</span>
                <p className="font-bold text-foreground">{detalhesApontamento.maquina?.modelo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Obra:</span>
                <p className="font-bold text-foreground">{detalhesApontamento.obra?.nome}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Horímetro Inicial / Final:</span>
                <p className="font-bold font-mono text-foreground">
                  {detalhesApontamento.horimetro_inicial}h → {detalhesApontamento.horimetro_final}h
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Horas & Valor Previsto:</span>
                <p className="font-bold font-mono text-pepsi-600 dark:text-pepsi-300 text-sm">
                  {formatHoursShort(detalhesApontamento.horas_trabalhadas)} (
                  {formatCurrency(detalhesApontamento.valor_total)})
                </p>
              </div>
            </div>

            {detalhesApontamento.descricao && (
              <div className="text-xs text-muted-foreground">
                <strong>Descrição:</strong> {detalhesApontamento.descricao}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetalhesApontamento(null)}
                className="text-xs font-semibold"
              >
                Fechar
              </Button>

              {detalhesApontamento.status !== 'aprovado' && (
                <Button
                  size="sm"
                  onClick={() => handleAprovar(detalhesApontamento)}
                  className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                >
                  <Check className="w-4 h-4" /> Aprovar Agora
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
