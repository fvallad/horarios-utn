import { useState } from 'react'
import { useProfesoresList, upsertProfesor, deleteProfesor } from '../hooks/useHorarios'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react'

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

function ProfesorForm({ initial, onSave, onClose }) {
  const { user } = useAuth()
  const [form, setForm] = useState(initial || { nombre: '', email: '', activo: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    const { error } = await upsertProfesor(form, user)
    if (error) setError(error.message)
    else { onSave(); onClose() }
    setSaving(false)
  }

  return (
    <div className="horario-form">
      <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-field">
          <label>Nombre completo<span className="req">*</span></label>
          <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Apellido, Nombre" />
        </div>
        <div className="form-field">
          <label>Email</label>
          <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="docente@utn.edu.ar" />
        </div>
        <div className="form-field">
          <label>Estado</label>
          <select value={form.activo ? 'true' : 'false'} onChange={e => set('activo', e.target.value === 'true')}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Check size={16} /> {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export default function ProfesoresABM() {
  const { isAdmin, user } = useAuth()
  const { data, loading, refetch } = useProfesoresList()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = search
    ? data.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : data

  const handleDelete = async (id) => {
    await deleteProfesor(id, user)
    setDeleting(null)
    refetch()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profesores</h1>
          <p className="page-subtitle">{data.length} profesores registrados</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setModal('new')}>
            <Plus size={16} /> Nuevo profesor
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={15} />
          <input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="table-loading"><span className="spinner" />Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 4 : 3} className="empty-row">Sin resultados</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td className="fw-medium">{p.nombre}</td>
                  <td className="text-muted">{p.email || '—'}</td>
                  <td>
                    <span className={`status-badge ${p.activo ? 'active' : 'inactive'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="actions-cell">
                      <button className="icon-btn edit" onClick={() => setModal(p)}><Edit2 size={14} /></button>
                      <button className="icon-btn del" onClick={() => setDeleting(p)}><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'new' ? 'Nuevo profesor' : 'Editar profesor'} onClose={() => setModal(null)}>
          <ProfesorForm
            initial={modal !== 'new' ? modal : null}
            onSave={refetch}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Eliminar profesor" onClose={() => setDeleting(null)}>
          <div className="confirm-delete">
            <p>¿Eliminás al profesor <strong>{deleting.nombre}</strong>?</p>
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
