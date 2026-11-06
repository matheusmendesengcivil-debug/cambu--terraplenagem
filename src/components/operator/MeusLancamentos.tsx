import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  FileText,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
} from 'lucide-react'
import { getApontamentos, deleteApontamento } from '@/services/cambui'
import { Apontamento } from '@/types/cambui'
import {
  formatDateBR,
  formatHoursShort,
  isVeiculo,
  unidadeMedidor,
  nomeEquipamento,
} from '@/lib/formatters'
import { AnexoThumb } from '@/components/shared/AnexoPicker'
import { toast } from 'sonner'

interface MeusLancamentosProps {
  onBack: () => void
  onNovo: () => void
  onEditar?: (ap: Apontamento) => void
  isAdmin?: boolean
}

export const MeusLancamentos: React.FC<MeusLancamentosProps> = ({
  onBack,
  onNovo,
  onEditar,
  isAdmin = false,
}) => {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getApontamentos()
      setApontamentos(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleExcluir = async (ap: Apontamento) => {
    if (!window.confirm('Excluir este lançamento? Essa ação não pode ser desfeita.')) return
    const { error } = await deleteApontamento(ap.id)
    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
      return
    }
    toast.success('Lançamento excluído.')
    await loadData()
  }

  // Operador só edita o que ainda não foi aprovado; admin edita tudo
  const podeEditar = (ap: Apontamento) => !ap.is_offline && (isAdmin || ap.status !== 'aprovado')

  const filtrados = apontamentos.filter((a) => {
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false
    if (busca) {
      const q = busca.toLowerCase()
      const maq = nomeEquipamento(a.maquina).toLowerCase()
      const op = (a.funcionario?.nome || '').toLowerCase()
      const obr = (a.obra?.nome || '').toLowerCase()
      const cli = (a.cliente?.nome || '').toLowerCase()
      const desc = (a.descricao || '').toLowerCase()
      return (
        maq.includes(q) || op.includes(q) || obr.includes(q) || cli.includes(q) || desc.includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-4 pb-16 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight">
              {isAdmin ? 'LANÇAMENTOS' : 'MEUS LANÇAMENTOS'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? 'Todos os apontamentos — toque em Editar para alterar'
                : 'Histórico de apontamentos de campo'}
            </p>
          </div>
        </div>
        <Button
          onClick={onNovo}
          size="sm"
          className="bg-pepsi-600 hover:bg-pepsi-700 text-white font-bold text-xs h-9"
        >
          + Lançar
        </Button>
      </div>

      {/* Filter status buttons */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-xl text-[11px] font-bold">
        <button
          onClick={() => setFiltroStatus('todos')}
          className={`py-1.5 rounded-lg transition-all ${filtroStatus === 'todos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Todos ({apontamentos.length})
        </button>
        <button
          onClick={() => setFiltroStatus('pendente')}
          className={`py-1.5 rounded-lg transition-all ${filtroStatus === 'pendente' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Pendentes ({apontamentos.filter((a) => a.status === 'pendente').length})
        </button>
        <button
          onClick={() => setFiltroStatus('aprovado')}
          className={`py-1.5 rounded-lg transition-all ${filtroStatus === 'aprovado' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Aprovados ({apontamentos.filter((a) => a.status === 'aprovado').length})
        </button>
        <button
          onClick={() => setFiltroStatus('devolvido')}
          className={`py-1.5 rounded-lg transition-all ${filtroStatus === 'devolvido' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Devolvidos ({apontamentos.filter((a) => a.status === 'devolvido').length})
        </button>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Buscar por máquina, obra ou serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-10 text-xs"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Carregando apontamentos...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="p-8 text-center border rounded-xl bg-card text-xs text-muted-foreground">
          Nenhum apontamento encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((ap) => (
            <Card key={ap.id} className="border-2 overflow-hidden shadow-sm">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDateBR(ap.data)}
                      </span>
                      {ap.is_offline ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                          Não sincronizado
                        </Badge>
                      ) : ap.status === 'aprovado' ? (
                        <Badge className="bg-emerald-600 text-[10px] px-1.5 py-0 h-4">
                          Aprovado
                        </Badge>
                      ) : ap.status === 'devolvido' ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                          Devolvido
                        </Badge>
                      ) : ap.status === 'rascunho_foto' ? (
                        <Badge
                          variant="secondary"
                          className="bg-purple-600/20 text-purple-700 text-[10px] px-1.5 py-0 h-4"
                        >
                          Rascunho Foto
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-pepsi-600 text-pepsi-600 dark:text-pepsi-300 text-[10px] px-1.5 py-0 h-4"
                        >
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-foreground mt-1">
                      {nomeEquipamento(ap.maquina)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Obra:{' '}
                      <span className="font-semibold text-foreground">
                        {ap.obra?.nome || 'Não informada'}
                      </span>
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-muted-foreground">
                        Operador:{' '}
                        <span className="font-semibold text-foreground">
                          {ap.funcionario?.nome || 'Não informado'}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-pepsi-600 dark:text-pepsi-300">
                      {isVeiculo(ap.maquina)
                        ? ap.horimetro_final != null && ap.horimetro_inicial != null
                          ? `${(Number(ap.horimetro_final) - Number(ap.horimetro_inicial)).toFixed(1)} km`
                          : '—'
                        : ap.horas_trabalhadas != null
                          ? formatHoursShort(ap.horas_trabalhadas)
                          : '—'}
                    </div>
                    {(ap.horimetro_inicial != null || ap.horimetro_final != null) && (
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {ap.horimetro_inicial ?? '?'}
                        {unidadeMedidor(ap.maquina)} → {ap.horimetro_final ?? '?'}
                        {unidadeMedidor(ap.maquina)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Returned comment */}
                {ap.status === 'devolvido' && ap.motivo_devolucao && (
                  <div className="p-2.5 bg-red-500/15 border border-red-500/40 rounded-lg text-xs text-red-900 dark:text-red-200">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Motivo da Devolução pelo
                      Admin:
                    </p>
                    <p className="mt-0.5">{ap.motivo_devolucao}</p>
                  </div>
                )}

                {/* Services tags */}
                {ap.servicos && ap.servicos.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ap.servicos.map((s) => (
                      <span
                        key={s.id}
                        className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium"
                      >
                        {s.nome}
                      </span>
                    ))}
                  </div>
                )}

                {ap.descricao && (
                  <p className="text-xs text-muted-foreground italic border-t pt-1.5">
                    "{ap.descricao}"
                  </p>
                )}

                {ap.quantidade_viagens ? (
                  <div className="text-xs font-semibold text-foreground">
                    🚛 {ap.quantidade_viagens} viagens de caminhão
                  </div>
                ) : null}

                {ap.fotos && ap.fotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {ap.fotos.map((f) => (
                      <AnexoThumb key={f.id} url={f.url} size="w-14 h-14" />
                    ))}
                  </div>
                )}

                {(onEditar || isAdmin) && (
                  <div className="flex justify-end gap-1 pt-2 border-t">
                    {onEditar && podeEditar(ap) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditar(ap)}
                        className="text-xs h-8 gap-1 font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </Button>
                    )}
                    {isAdmin && !ap.is_offline && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluir(ap)}
                        className="text-xs h-8 gap-1 font-semibold text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
