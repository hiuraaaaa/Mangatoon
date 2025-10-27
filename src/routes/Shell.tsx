
import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
function BottomNav(){
  const item='flex flex-col items-center justify-center gap-1 text-xs'
  const active=({isActive}:{isActive:boolean})=> isActive?'text-white':'text-muted'
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-edge grid grid-cols-4 py-2 sm:hidden">
      <NavLink to="/" className={({isActive})=>`${item} ${active({isActive})}`}>🏠<span>Beranda</span></NavLink>
      <NavLink to="/komik" className={({isActive})=>`${item} ${active({isActive})}`}>📚<span>Komik</span></NavLink>
      <NavLink to="/pencarian" className={({isActive})=>`${item} ${active({isActive})}`}>🔍<span>Cari</span></NavLink>
      <NavLink to="/daftar-bacaan" className={({isActive})=>`${item} ${active({isActive})}`}>❤️<span>Favorit</span></NavLink>
    </nav>
  )
}
export default function Shell(){
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <header className="container-page flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">Manga<span className="text-accent">toon</span></Link>
        <div className="hidden sm:flex items-center gap-2">
          <NavLink to="/" className="btn">Beranda</NavLink>
          <NavLink to="/komik" className="btn">Komik</NavLink>
          <NavLink to="/pencarian" className="btn">Pencarian</NavLink>
          <NavLink to="/daftar-bacaan" className="btn">Daftar bacaan</NavLink>
          <NavLink to="/admin" className="btn">Dashboard</NavLink>
          {user && (<button className="btn" onClick={logout}>Keluar {user.displayName? '('+user.displayName.split(' ')[0]+')':''}</button>)}
        </div>
      </header>
      <Outlet/>
      <footer className="container-page flex items-center justify-between border-t border-edge mt-8 pt-4">
        <p className="muted">© Nekotoon.</p>
        <a className="badge" href="https://wa.me/6281234567890" target="_blank">WhatsApp</a>
      </footer>
      <BottomNav/>
    </div>
  )
}
