import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  HardHat,
  Camera,
  Fuel,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  LogOut,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { getApontamentos, isOnline, syncOfflineQueue } from '@/services/cambui'
import { Apontamento } from '@/types/cambui'
import { formatHoursShort, formatDateBR } from '@/lib/formatters'
import { toast } from 'sonner'

interface OperatorHomeProps {
  onNavigate: (tab: string) => void
}

export const OperatorHome: React.FC<OperatorHomeProps> = ({ onNavigate }) => {
  const { usuario, signOut, switchUserSimulated } = useAuth()
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(isOnline())
  const [syncing, setSyncing] = useState(false)

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      toast.success('Conexão restabelecida! Sincronizando dados...')
      handleSync()
    }
    const handleOffline = () => {
      setOnline(false)
      toast.warning('Modo Offline ativado. Seus lançamentos serão salvos no aparelho.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncOfflineQueue()
      if (res.syncedCount > 0) {
        toast.success(`${res.syncedCount} apontamento(s) sincronizado(s) com sucesso!`)
        await loadData()
      } else {
        toast.info('Tudo atualizado com o servidor.')
      }
    } finally {
      setSyncing(false)
    }
  }

  // Calculate Operator Weekly & Monthly hours
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const horasSemana = apontamentos
    .filter((a) => {
      const d = new Date(a.data)
      return d >= startOfWeek
    })
    .reduce((acc, a) => acc + Number(a.horas_trabalhadas || 0), 0)

  const horasMes = apontamentos
    .filter((a) => {
      const d = new Date(a.data)
      return d >= startOfMonth
    })
    .reduce((acc, a) => acc + Number(a.horas_trabalhadas || 0), 0)

  // Recent 3 appointments
  const ultimos = apontamentos.slice(0, 3)
  const temPendenciaOntem = false // can check if launched yesterday

  return (
    <div className="space-y-4 pb-12">
      {/* Offline / Online banner */}
      <div
        className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
          online
            ? 'bg-prata-300/25 text-pepsi-900 dark:text-pepsi-300 border border-prata-400/50'
            : 'bg-red-500/20 text-red-900 dark:text-red-300 border border-red-500/40'
        }`}
      >
        <div className="flex items-center gap-2">
          {online ? (
            <Wifi className="w-4 h-4 text-emerald-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600 animate-pulse" />
          )}
          <span>
            {online ? 'Conectado ao Cambuí Gestão' : 'SEM SINAL - Modo de Campo (Offline)'}
          </span>
        </div>
        {online && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 gap-1 text-pepsi-900 dark:text-pepsi-200"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        )}
      </div>

      {/* Operator greeting & quick switch for testing */}
      <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Operador de Campo
          </span>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
            <HardHat className="w-5 h-5 text-pepsi-500" />
            {usuario?.nome || 'Operador Cambuí'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{usuario?.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="h-8 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </Button>
        </div>
      </div>

      {/* Reminder banner if operator hasn't launched */}
      <div className="bg-prata-300/35 border-2 border-prata-400/60 rounded-xl p-3.5 flex items-start gap-3">
        <Bell className="w-5 h-5 text-pepsi-600 dark:text-pepsi-300 shrink-0 mt-0.5 animate-bounce" />
        <div className="text-xs flex-1">
          <p className="font-bold text-pepsi-950 dark:text-pepsi-200 text-sm">
            Lembrete de Fechamento Diário
          </p>
          <p className="text-pepsi-900/80 dark:text-pepsi-300 mt-0.5">
            Ao encerrar a jornada com a máquina, lance o horímetro final ou fotografe sua ficha em
            papel!
          </p>
        </div>
      </div>

      {/* Large hours summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-2 border-prata-400/60 bg-gradient-to-br from-prata-300/25 to-transparent">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-pepsi-500" /> Horas na Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-black text-foreground tracking-tight">
              {formatHoursShort(horasSemana)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total apontado</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-card">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> Horas no Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-black text-foreground tracking-tight">
              {formatHoursShort(horasMes)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Produção acumulada</p>
          </CardContent>
        </Card>
      </div>

      {/* BIG PRIMARY BUTTONS (DESIGNED FOR PHONE UNDER SUNLIGHT) */}
      <div className="space-y-3 pt-1">
        <Button
          onClick={() => onNavigate('lancar-dia')}
          className="w-full h-20 text-lg font-black bg-pepsi-600 hover:bg-pepsi-700 text-white shadow-lg border-2 border-prata-400/60 rounded-2xl flex items-center justify-between px-5 transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-12 h-12 rounded-xl bg-prata-300/45 flex items-center justify-center shrink-0">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-lg leading-tight">LANÇAR MEU DIA</div>
              <div className="text-xs font-normal opacity-85">
                Horímetro, máquina, obra e serviços
              </div>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 shrink-0" />
        </Button>

        <Button
          onClick={() => onNavigate('foto-folha')}
          variant="secondary"
          className="w-full h-18 text-base font-bold bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-700 rounded-2xl flex items-center justify-between px-5 py-4 transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-11 h-11 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-pepsi-400" />
            </div>
            <div>
              <div className="text-base leading-tight">ENVIAR FOTO DA FOLHA</div>
              <div className="text-xs font-normal text-zinc-300">Tirar foto da ficha em papel</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onNavigate('abastecimento')}
            variant="outline"
            className="h-16 font-bold text-sm bg-card hover:bg-prata-300/25 border-2 rounded-xl flex items-center gap-2.5 px-3.5 justify-start text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-prata-300/35 flex items-center justify-center shrink-0">
              <Fuel className="w-5 h-5 text-pepsi-500" />
            </div>
            <div className="leading-tight">
              <div>Abastecimento</div>
              <span className="text-[10px] font-normal text-muted-foreground">
                Diesel e horímetro
              </span>
            </div>
          </Button>

          <Button
            onClick={() => onNavigate('manutencao')}
            variant="outline"
            className="h-16 font-bold text-sm bg-card hover:bg-prata-300/25 border-2 rounded-xl flex items-center gap-2.5 px-3.5 justify-start text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-prata-300/35 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-pepsi-500" />
            </div>
            <div className="leading-tight">
              <div>Manutenção</div>
              <span className="text-[10px] font-normal text-muted-foreground">Óleo e graxa</span>
            </div>
          </Button>
        </div>

        <Button
          onClick={() => onNavigate('meus-lancamentos')}
          variant="outline"
          className="w-full h-14 font-bold text-sm bg-card hover:bg-muted border-2 rounded-xl flex items-center justify-between px-4"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span>Meus Lançamentos Recentes</span>
          </div>
          <Badge
            variant="outline"
            className="text-xs bg-prata-300/25 text-pepsi-600 dark:text-pepsi-300 border-prata-400/60"
          >
            {apontamentos.length} total
          </Badge>
        </Button>
      </div>

      {/* Recent submissions preview */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">Últimos Apontamentos</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-pepsi-600 dark:text-pepsi-300 h-7 px-1.5"
            onClick={() => onNavigate('meus-lancamentos')}
          >
            Ver todos
          </Button>
        </div>

        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>
        ) : ultimos.length === 0 ? (
          <div className="p-6 text-center border rounded-xl bg-card text-xs text-muted-foreground">
            Nenhum apontamento lançado ainda. Clique em "Lançar meu dia"!
          </div>
        ) : (
          <div className="space-y-2">
            {ultimos.map((ap) => (
              <div
                key={ap.id}
                onClick={() => onNavigate('meus-lancamentos')}
                className="p-3 border rounded-xl bg-card hover:border-prata-400/80 transition-colors cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {formatDateBR(ap.data)}
                    </span>
                    {ap.is_offline ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                        Não sincronizado
                      </Badge>
                    ) : ap.status === 'aprovado' ? (
                      <Badge className="bg-emerald-600 text-[10px] px-1.5 py-0 h-4">Aprovado</Badge>
                    ) : ap.status === 'devolvido' ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                        Devolvido
                      </Badge>
                    ) : ap.status === 'rascunho_foto' ? (
                      <Badge
                        variant="secondary"
                        className="bg-purple-600/20 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0 h-4"
                      >
                        Rascunho de Foto
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
                  <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                    {ap.maquina?.modelo || 'Máquina'} • {ap.obra?.nome || 'Obra'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-foreground">
                    {formatHoursShort(ap.horas_trabalhadas)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {ap.horimetro_inicial}h → {ap.horimetro_final}h
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
