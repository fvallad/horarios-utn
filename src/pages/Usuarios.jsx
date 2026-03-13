import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit2, Trash2, X, Check, ShieldCheck, Eye } from 'lucide-react'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Usuarios() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_users')
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const handleSetRole = async (userId, role) => {
    await supabase.rpc('set_user_role', { user_id: userId, new_role: role })
    loadUsers()
  }

  const handleDelete = async (userId) => {
    await supabase.rpc('delete_user', { user_id: userId })
    setDeleting(null)
    loadUsers()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Usuarios del sistema</h1>
          <p className="page-subtitle">{users.length} usuarios registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="table-loading"><span className="spinner" />Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Último acceso</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="fw-medium">
                    {u.email}
                    {u.id === currentUser?.id && <span className="you-badge">vos</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${u.role === 'admin' ? 'active' : 'inactive'}`}>
                      {u.role === 'admin' ? <><ShieldCheck size={11} /> Admin</> : <><Eye size={11} /> Consulta</>}
                    </span>
                  </td>
                  <td className="text-muted text-sm">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('es-AR') : 'Nunca'}
                  </td>
                  <td className="text-muted text-sm">
                    {new Date(u.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="icon-btn edit"
                      title={u.role === 'admin' ? 'Cambiar a Consulta' : 'Cambiar a Admin'}
                      onClick={() => handleSetRole(u.id, u.role === 'admin' ? 'consulta' : 'admin')}
                    >
                      {u.role === 'admin' ? <Eye size={14} /> : <ShieldCheck size={14} />}
                    </button>
                    {u.id !== currentUser?.id && (
                      <button className="icon-btn del" onClick={() => setDeleting(u)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'new' && (
        <Modal title="Nuevo usuario" onClose={() => { setModal(null); setError('') }}>
          <NewUserForm
            onSave={() => { loadUsers(); setModal(null) }}
            onClose={() => { setModal(null); setError('') }}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Eliminar usuario" onClose={() => setDeleting(null)}>
          <div className="confirm-delete">
            <p>¿Eliminás el usuario <strong>{deleting.email}</strong>?</p>
            <p className="text-muted text-sm">Esta acción no se puede deshacer.</p>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleDelete(deleting.id)}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function NewUserForm({ onSave, onClose }) {
  const [form, setForm] = useState({ email: '', password: '', role: 'consulta' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.email || !form.password) { setError('Email y contraseña son obligatorios.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setSaving(true)

    const { data, error } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      user_metadata: { role: form.role },
      email_confirm: true,
    })

    if (error) {
      // fallback: signUp if admin API not available on free tier
      const { error: e2 } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { role: form.role } }
      })
      if (e2) { setError(e2.message); setSaving(false); return }
    }

    onSave()
    setSaving(false)
  }

  return (
    <div className="horario-form">
      <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-field">
          <label>Email<span className="req">*</span></label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="usuario@utn.edu.ar" />
        </div>
        <div className="form-field">
          <label>Contraseña<span className="req">*</span></label>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
        </div>
        <div className="form-field">
          <label>Rol</label>
          <select value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="consulta">Consulta</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Check size={16} /> {saving ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
    </div>
  )
}
