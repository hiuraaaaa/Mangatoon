// src/lib/AuthContext.tsx
import React from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut,
  User,
} from 'firebase/auth'
import { auth, provider } from './firebase'

// Bentuk context
type Ctx = {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  error: string | null
}

const AuthCtx = React.createContext<Ctx>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  error: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Simpan sesi ke localStorage agar tetap login setelah reload
    setPersistence(auth, browserLocalPersistence).catch(() => {})

    // Jika baru balik dari signInWithRedirect(), ambil result-nya (supaya tidak mentok di /login)
    getRedirectResult(auth).catch(() => {})

    // Dengarkan perubahan state auth
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const login = async () => {
    setError(null)
    try {
      // Coba popup (desktop / mobile yg izinkan popup)
      await signInWithPopup(auth, provider)
    } catch (e: any) {
      // Kalau popup diblokir (mobile browser), fallback ke redirect
      if (
        String(e?.code || '').includes('popup') ||
        String(e?.message || '').toLowerCase().includes('popup')
      ) {
        await signInWithRedirect(auth, provider)
        return
      }
      setError(e?.message || 'Login gagal')
      throw e
    }
  }

  const logout = async () => {
    setError(null)
    await signOut(auth)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => React.useContext(AuthCtx)
