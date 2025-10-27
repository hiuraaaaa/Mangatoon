
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/AuthContext'
import RequireAuth from './components/RequireAuth'

import Shell from './routes/Shell'
import Home from './routes/Home'
import Search from './routes/Search'
import Library from './routes/Library'
import Series from './routes/Series'
import Reader from './routes/Reader'
import Admin from './routes/Admin'
import Login from './routes/Login'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Shell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'komik', element: <Home /> },
      { path: 'pencarian', element: <Search /> },
      { path: 'daftar-bacaan', element: <Library /> },
      { path: 'manga/:slug', element: <Series /> },
      { path: 'manga/:slug/:chapter', element: <Reader /> },
      { path: 'admin', element: <Admin /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
