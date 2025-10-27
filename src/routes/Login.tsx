// src/routes/Login.tsx
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { login, user, loading, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any

  // jika sebelumnya user diarahkan dari halaman tertentu, kembalikan ke sana
  const from = location.state?.from?.pathname || '/'

  React.useEffect(() => {
    // kalau sudah login dan selesai loading, langsung arahkan ke halaman utama
    if (!loading && user) navigate(from, { replace: true })
  }, [loading, user, from, navigate])

  const handleLogin = async () => {
    try {
      await login()
    } catch (e: any) {
      console.error('Login gagal:', e)
      alert('Login gagal, coba lagi.')
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#111] text-white">
      <div className="p-6 bg-[#1b1b1b] rounded-xl shadow-md w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold mb-4">Masuk untuk melanjutkan</h1>

        {error && (
          <div className="mb-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        >
          🔐 Lanjutkan dengan Google
        </button>

        <p className="mt-3 text-gray-400 text-sm">
          Kamu perlu login Google untuk mengakses aplikasi.
        </p>
      </div>
    </main>
  )
}
