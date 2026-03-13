import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, CalendarDays, Table2, Users, LogOut, ShieldCheck } from 'lucide-react'

const nav = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/horarios',   icon: Table2,          label: 'Horarios'   },
  { to: '/calendario', icon: CalendarDays,    label: 'Calendario' },
  { to: '/profesores', icon: Users,           label: 'Profesores' },
]

export default function Sidebar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">UTN</div>
        <div className="brand-text">
          <span className="brand-title">Profesorado</span>
          <span className="brand-sub">Ciclo 2026</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
          <div className="user-details">
            <span className="user-email">{user?.email}</span>
            <span className={`user-role ${isAdmin ? 'admin' : 'consulta'}`}>
              {isAdmin ? <><ShieldCheck size={11} /> Admin</> : 'Consulta'}
            </span>
          </div>
        </div>
        <button className="btn-logout" onClick={handleSignOut} title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
