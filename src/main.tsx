import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/AuthContext'
import RequireAuth from './components/RequireAuth'

// Routes utama
import Shell from './routes/Shell'
import Home from './routes/Home'
import Search from './routes/Search'
import Library from './routes/Library'
import Series from './routes/Series'
import Reader from './routes/Reader'
import Admin from './routes/Admin'
import Login from './routes/Login'

// Tambahan uploader
import RequireAdmin from './routes/RequireAdmin'
import GithubUploader from './routes/GithubUploader'

const router = createBrowserRouter([
  // Login page
  { path: '/login', element: <Login /> },

  // Semua halaman di bawah ini butuh login dulu
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
      { path: 'admin', element: <Admin /> },

      // 🆕 Tambahan halaman uploader
      {
        path: 'uploader',
        element: (
          <RequireAdmin>
            <GithubUploader />
          </RequireAdmin>
        )
      }
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
