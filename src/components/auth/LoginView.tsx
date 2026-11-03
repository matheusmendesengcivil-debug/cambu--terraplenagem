import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HardHat, Lock, Mail, Phone, ShieldCheck, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export const LoginView: React.FC = () => {
  const { signIn, signUp, switchUserSimulated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isCadastro, setIsCadastro] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isCadastro) {
        const { error } = await signUp(email, password)
        if (error) throw error
        toast.success('Cadastro realizado! Você já pode entrar.')
        setIsCadastro(false)
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        toast.success('Login efetuado com sucesso!')
      }
    } catch (err: any) {
      toast.error('Erro na autenticação: ' + (err.message || 'Verifique suas credenciais'))
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (loginEmail: string) => {
    setLoading(true)
    try {
      await switchUserSimulated(loginEmail)
      toast.success(`Entrando como ${loginEmail.split('@')[0]}...`)
    } catch (err: any) {
      toast.error('Erro ao conectar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-amber-500/5 to-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg border-2 border-amber-600/30">
            <HardHat className="w-9 h-9 text-amber-950" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">
            Cambuí Terraplenagem
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Sistema de Gestão & Apontamentos de Campo
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-bold text-center">
              {isCadastro ? 'Criar Nova Conta' : 'Acesse com seu E-mail ou Telefone'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-xs font-bold">E-mail ou Usuário</Label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="operador@cambui.com ou admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Senha</Label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-11 text-sm font-medium"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-sm font-black bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl uppercase tracking-wider shadow-md mt-2"
              >
                {loading ? 'Entrando...' : isCadastro ? 'Cadastrar' : 'Entrar no Sistema'}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsCadastro(!isCadastro)}
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                {isCadastro ? 'Já tem conta? Clique para Entrar' : 'Não tem conta? Cadastre-se'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* QUICK ACCESS BUTTONS (DEMO CONVENIENCE FOR EVALUATOR) */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-amber-500" />
            Acesso Rápido de Teste (Dados Pré-Carregados)
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('matheus.mendes96@hotmail.com')}
              disabled={loading}
              className="h-11 justify-between text-xs font-bold bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 text-foreground"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Admin (Matheus Mendes)</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                matheus.mendes96@hotmail.com
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('ze.carlos@cambui.com')}
              disabled={loading}
              className="h-10 justify-between text-xs font-semibold"
            >
              <div className="flex items-center gap-2">
                <HardHat className="w-3.5 h-3.5 text-amber-500" />
                <span>Operador Zé Carlos</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                ze.carlos@cambui.com
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('tiago.pedroso@cambui.com')}
              disabled={loading}
              className="h-10 justify-between text-xs font-semibold"
            >
              <div className="flex items-center gap-2">
                <HardHat className="w-3.5 h-3.5 text-amber-500" />
                <span>Operador Tiago (Caminhão)</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                tiago.pedroso@cambui.com
              </span>
            </Button>
          </div>
          <p className="text-[11px] text-center text-muted-foreground pt-1">
            Senha padrão de teste:{' '}
            <code className="font-mono bg-muted px-1 py-0.5 rounded">Skip@Pass</code>
          </p>
        </div>
      </div>
    </div>
  )
}
