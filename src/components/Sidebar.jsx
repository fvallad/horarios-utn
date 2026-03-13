import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, CalendarDays, Table2, Users, LogOut, ShieldCheck, GraduationCap, ClipboardList, UserCog, Eye } from 'lucide-react'

export default function Sidebar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const nav = [
    { to: '/',                 icon: LayoutDashboard, label: 'Dashboard',       always: true },
    { to: '/horarios',         icon: Table2,          label: 'Horarios',        always: true },
    { to: '/calendario',       icon: CalendarDays,    label: 'Calendario',      always: true },
    { to: '/profesores-vista', icon: Users,           label: 'Profesores',      always: true },
    { to: '/profesores-abm',   icon: GraduationCap,   label: 'ABM Profesores',  admin: true  },
    { to: '/usuarios',         icon: UserCog,         label: 'Usuarios',        admin: true  },
    { to: '/audit',            icon: ClipboardList,   label: 'Log cambios',     admin: true  },
  ]

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Logo" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {nav.filter(n => n.always || (n.admin && isAdmin)).map(({ to, icon: Icon, label }) => (
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
              {isAdmin ? <><ShieldCheck size={11} /> Admin</> : <><Eye size={11} /> Consulta</>}
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
