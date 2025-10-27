
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
export default function RequireAuth({ children }:{ children: React.ReactNode }){
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="container-page">Loading…</div>
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  return <>{children}</>
}
