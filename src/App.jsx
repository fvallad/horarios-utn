import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Horarios from './pages/Horarios'
import Calendario from './pages/Calendario'
import Profesores from './pages/Profesores'
import ProfesoresABM from './pages/ProfesoresABM'
import Usuarios from './pages/Usuarios'
import AuditLog from './pages/AuditLog'

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading"><span className="spinner lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/"                   element={<Dashboard />} />
          <Route path="/horarios"           element={<Horarios />} />
          <Route path="/calendario"         element={<Calendario />} />
          <Route path="/profesores-vista"   element={<Profesores />} />
          <Route path="/profesores-abm"     element={<AdminRoute><ProfesoresABM /></AdminRoute>} />
          <Route path="/usuarios"           element={<AdminRoute><Usuarios /></AdminRoute>} />
          <Route path="/audit"              element={<AdminRoute><AuditLog /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
