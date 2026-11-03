import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Usuario } from '@/types/cambui'

interface AuthContextType {
  user: User | null
  session: Session | null
  usuario: Usuario | null
  isAdmin: boolean
  isOperador: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
  refreshUsuario: () => Promise<void>
  switchUserSimulated: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch or sync public.usuarios profile
  const fetchUsuarioProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (data && !error) {
        setUsuario(data as Usuario)
      } else if (email) {
        // Fallback: check by email or create local profile
        const { data: byEmail } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .maybeSingle()

        if (byEmail) {
          setUsuario(byEmail as Usuario)
        } else {
          // Default profile if newly registered
          const isAdminEmail = email.includes('admin') || email === 'matheus.mendes96@hotmail.com'
          const defaultUser: Usuario = {
            id: userId,
            email,
            nome: email.split('@')[0],
            perfil: isAdminEmail ? 'admin' : 'operador',
            ativo: true,
          }
          setUsuario(defaultUser)
        }
      }
    } catch (e) {
      console.error('Error fetching usuario profile:', e)
    }
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // FORBIDDEN: no async/await inside this callback — sync only
      setSession(session)
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUsuario(null)
        setLoading(false)
      } else {
        // Trigger profile load without await
        fetchUsuarioProfile(session.user.id, session.user.email).finally(() => {
          setLoading(false)
        })
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUsuarioProfile(session.user.id, session.user.email).finally(() => {
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshUsuario = async () => {
    if (user) {
      await fetchUsuarioProfile(user.id, user.email)
    }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        await fetchUsuarioProfile(data.user.id, data.user.email)
      }
    }
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setUsuario(null)
    return { error }
  }

  const switchUserSimulated = async (email: string) => {
    // Quick-switch helper for testing between seeded accounts with Skip@Pass
    await signIn(email, 'Skip@Pass')
  }

  const isAdmin =
    usuario?.perfil === 'admin' ||
    (user?.email?.includes('admin') ?? false) ||
    user?.email === 'matheus.mendes96@hotmail.com'
  const isOperador = !isAdmin

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        usuario,
        isAdmin,
        isOperador,
        signUp,
        signIn,
        signOut,
        loading,
        refreshUsuario,
        switchUserSimulated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
