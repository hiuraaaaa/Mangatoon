
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

// Ganti email ini dengan email Google kamu
const ADMINS = ['emailkamu@gmail.com']

export default function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <main className="container-page">Memuat…</main>
  const ok = !!user && ADMINS.includes((user.email || '').toLowerCase())
  return ok ? children : <Navigate to="/" replace />
}
