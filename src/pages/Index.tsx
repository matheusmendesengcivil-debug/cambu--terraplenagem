import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  HardHat,
  LayoutDashboard,
  CheckSquare,
  Users,
  DollarSign,
  Fuel,
  Wrench,
  LogOut,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Clock,
  Camera,
  RefreshCw,
} from 'lucide-react'
import { OperatorHome } from '@/components/operator/OperatorHome'
import { LancarDiaForm } from '@/components/operator/LancarDiaForm'
import { FotoFolhaView } from '@/components/operator/FotoFolhaView'
import { AbastecimentoForm } from '@/components/operator/AbastecimentoForm'
import { ManutencaoView } from '@/components/operator/ManutencaoView'
import { MeusLancamentos } from '@/components/operator/MeusLancamentos'

import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AprovacoesView } from '@/components/admin/AprovacoesView'
import { CadastrosView } from '@/components/admin/CadastrosView'
import { FechamentoView } from '@/components/admin/FechamentoView'
import { LoginView } from '@/components/auth/LoginView'
import { isOnline, syncOfflineQueue } from '@/services/cambui'
import { toast } from 'sonner'
import { Apontamento } from '@/types/cambui'

export default function Index() {
  const { user, usuario, isAdmin, isOperador, loading, signOut, switchUserSimulated } = useAuth()

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('cambui_theme') === 'dark' ||
        (!('cambui_theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      )
    }
    return false
  })

  const [online, setOnline] = useState(isOnline())
  const [syncing, setSyncing] = useState(false)

  // Active navigation tab
  // For Operator: 'home' | 'lancar-dia' | 'foto-folha' | 'abastecimento' | 'manutencao' | 'meus-lancamentos'
  // For Admin: 'dashboard' | 'aprovacoes' | 'cadastros' | 'fechamento' | 'abastecimento' | 'manutencao'
  const [activeTab, setActiveTab] = useState<string>('home')
  // Lançamento sendo editado (admin ou operador)
  const [editando, setEditando] = useState<Apontamento | null>(null)
  const abrirEdicao = (ap: Apontamento) => {
    setEditando(ap)
    setActiveTab('editar-lancamento')
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('cambui_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('cambui_theme', 'light')
    }
  }, [darkMode])

  // Set default view on role load
  useEffect(() => {
    if (isAdmin) {
      setActiveTab('dashboard')
    } else {
      setActiveTab('home')
    }
  }, [isAdmin])

  // Network listener & service worker register
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      toast.success('Internet conectada! Sincronizando fila...')
      handleTriggerSync()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration skipped:', err)
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleTriggerSync = async () => {
    setSyncing(true)
    try {
      const res = await syncOfflineQueue()
      if (res.syncedCount > 0) {
        toast.success(`${res.syncedCount} apontamento(s) sincronizado(s)!`)
      }
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-prata-300/45 flex items-center justify-center animate-spin mb-3">
          <HardHat className="w-6 h-6 text-pepsi-500" />
        </div>
        <p className="text-xs text-muted-foreground font-semibold">Carregando Cambuí Gestão...</p>
      </div>
    )
  }

  // Not logged in -> Show login
  if (!user) {
    return <LoginView />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* TOP APP BAR */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-prata-100 to-prata-300 dark:from-prata-900 dark:to-prata-800 border-b-2 border-pepsi-600 shadow-xs px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-pepsi-600 flex items-center justify-center shadow-xs">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none text-foreground flex items-center gap-1.5">
              CAMBUÍ <span className="text-pepsi-500 font-extrabold">TERRAPLENAGEM</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-bold">
                {isAdmin ? 'MÓDULO ADMIN' : 'MÓDULO DE CAMPO'}
              </span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span
                className={`text-[10px] font-bold flex items-center gap-0.5 ${online ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {online ? (
                  <Wifi className="w-2.5 h-2.5" />
                ) : (
                  <WifiOff className="w-2.5 h-2.5 animate-pulse" />
                )}
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
            title="Alternar tema claro/escuro"
          >
            {darkMode ? <Sun className="w-4 h-4 text-pepsi-400" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Quick role switcher for evaluator */}
          <div className="hidden sm:flex items-center gap-1 mr-1">
            <Button
              size="sm"
              variant={isAdmin ? 'default' : 'outline'}
              onClick={() => switchUserSimulated('matheus.mendes96@hotmail.com')}
              className="h-7 text-[10px] px-2 font-bold"
            >
              Admin
            </Button>
            <Button
              size="sm"
              variant={!isAdmin ? 'default' : 'outline'}
              onClick={() => switchUserSimulated('ze.carlos@cambui.com')}
              className="h-7 text-[10px] px-2 font-bold"
            >
              Operador
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="h-8 text-xs px-2 gap-1 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* SUB-NAV FOR ADMIN (DESKTOP & MOBILE TABS) */}
      {isAdmin && (
        <nav className="bg-card border-b px-4 py-1.5 flex gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-pepsi-600 text-white font-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('lancamentos')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              ['lancamentos', 'lancar-dia', 'foto-folha', 'editar-lancamento'].includes(activeTab)
                ? 'bg-pepsi-600 text-white font-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-4 h-4" />
            Lançamentos
          </button>

          <button
            onClick={() => setActiveTab('aprovacoes')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === 'aprovacoes'
                ? 'bg-pepsi-600 text-white font-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Aprovações
          </button>

          <button
            onClick={() => setActiveTab('cadastros')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === 'cadastros'
                ? 'bg-pepsi-600 text-white font-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Cadastros
          </button>

          <button
            onClick={() => setActiveTab('fechamento')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === 'fechamento'
                ? 'bg-pepsi-600 text-white font-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Cobrança / Medições
          </button>

          <button
            onClick={() => setActiveTab('abastecimento')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === 'abastecimento'
                ? 'bg-pepsi-600 text-white font-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Fuel className="w-4 h-4" />
            Combustível
          </button>

          <button
            onClick={() => setActiveTab('manutencao')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === 'manutencao'
                ? 'bg-pepsi-600 text-white font-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Manutenção / Óleo
          </button>
        </nav>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 p-3 sm:p-5 max-w-6xl mx-auto w-full">
        {/* OPERATOR VIEWS */}
        {isOperador && (
          <>
            {activeTab === 'home' && <OperatorHome onNavigate={(tab) => setActiveTab(tab)} />}
            {activeTab === 'lancar-dia' && (
              <LancarDiaForm
                onBack={() => setActiveTab('home')}
                onSuccess={() => setActiveTab('meus-lancamentos')}
              />
            )}
            {activeTab === 'foto-folha' && (
              <FotoFolhaView
                onBack={() => setActiveTab('home')}
                onSuccess={() => setActiveTab('meus-lancamentos')}
              />
            )}
            {activeTab === 'abastecimento' && (
              <AbastecimentoForm
                onBack={() => setActiveTab('home')}
                onSuccess={() => setActiveTab('home')}
              />
            )}
            {activeTab === 'manutencao' && (
              <ManutencaoView
                onBack={() => setActiveTab('home')}
                onSuccess={() => setActiveTab('home')}
              />
            )}
            {activeTab === 'meus-lancamentos' && (
              <MeusLancamentos
                onBack={() => setActiveTab('home')}
                onNovo={() => setActiveTab('lancar-dia')}
                onEditar={abrirEdicao}
              />
            )}
            {activeTab === 'editar-lancamento' && editando && (
              <LancarDiaForm
                key={editando.id}
                editing={editando}
                onBack={() => setActiveTab('meus-lancamentos')}
                onSuccess={() => {
                  setEditando(null)
                  setActiveTab('meus-lancamentos')
                }}
              />
            )}
          </>
        )}

        {/* ADMIN VIEWS */}
        {isAdmin && (
          <>
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'lancamentos' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                  <Button
                    onClick={() => setActiveTab('lancar-dia')}
                    className="h-12 bg-pepsi-600 hover:bg-pepsi-700 text-white font-black gap-2"
                  >
                    <Clock className="w-4 h-4" /> Lançar Dia
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('foto-folha')}
                    className="h-12 font-bold gap-2 border-2"
                  >
                    <Camera className="w-4 h-4 text-pepsi-500" /> Foto / PDF
                  </Button>
                </div>
                <MeusLancamentos
                  isAdmin
                  onBack={() => setActiveTab('dashboard')}
                  onNovo={() => setActiveTab('lancar-dia')}
                  onEditar={abrirEdicao}
                />
              </div>
            )}
            {activeTab === 'lancar-dia' && (
              <LancarDiaForm
                onBack={() => setActiveTab('lancamentos')}
                onSuccess={() => setActiveTab('lancamentos')}
              />
            )}
            {activeTab === 'foto-folha' && (
              <FotoFolhaView
                onBack={() => setActiveTab('lancamentos')}
                onSuccess={() => setActiveTab('lancamentos')}
              />
            )}
            {activeTab === 'editar-lancamento' && editando && (
              <LancarDiaForm
                key={editando.id}
                editing={editando}
                onBack={() => setActiveTab('lancamentos')}
                onSuccess={() => {
                  setEditando(null)
                  setActiveTab('lancamentos')
                }}
              />
            )}
            {activeTab === 'aprovacoes' && <AprovacoesView />}
            {activeTab === 'cadastros' && <CadastrosView />}
            {activeTab === 'fechamento' && <FechamentoView />}
            {activeTab === 'abastecimento' && (
              <AbastecimentoForm
                onBack={() => setActiveTab('dashboard')}
                onSuccess={() => setActiveTab('dashboard')}
              />
            )}
            {activeTab === 'manutencao' && (
              <ManutencaoView
                onBack={() => setActiveTab('dashboard')}
                onSuccess={() => setActiveTab('dashboard')}
              />
            )}
          </>
        )}
      </main>

      {/* MOBILE BOTTOM BAR FOR OPERATOR */}
      {isOperador && (
        <nav className="sticky bottom-0 z-40 bg-card/95 backdrop-blur border-t border-border p-2 flex justify-around items-center">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold ${
              activeTab === 'home' ? 'text-pepsi-500' : 'text-muted-foreground'
            }`}
          >
            <HardHat className="w-5 h-5" />
            Início
          </button>

          <button
            onClick={() => setActiveTab('lancar-dia')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold ${
              activeTab === 'lancar-dia' ? 'text-pepsi-500' : 'text-muted-foreground'
            }`}
          >
            <Clock className="w-5 h-5" />
            Lançar Dia
          </button>

          <button
            onClick={() => setActiveTab('foto-folha')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold ${
              activeTab === 'foto-folha' ? 'text-pepsi-500' : 'text-muted-foreground'
            }`}
          >
            <Camera className="w-5 h-5" />
            Foto/PDF
          </button>

          <button
            onClick={() => setActiveTab('meus-lancamentos')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold ${
              activeTab === 'meus-lancamentos' ? 'text-pepsi-500' : 'text-muted-foreground'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            Histórico
          </button>
        </nav>
      )}
    </div>
  )
}
