import { useState } from 'react'
import { useHorarios, useDistinctValues, upsertHorario, deleteHorario } from '../hooks/useHorarios'
import { useAuth } from '../hooks/useAuth'
import { Search, Plus, Edit2, Trash2, X, Check } from 'lucide-react'

const EMPTY = { mes:'', fecha:'', horario:'', sede:'', cohorte:'', cuatrimestre_clase:'', materia:'', profesor:'' }
const HORARIOS = ['9 a 12', '13 a 16', '16 a 19', '19 a 22']
const MES_ORDER = ['Febrero 2026','Marzo 2026','Abril 2026','Mayo 2026','Junio 2026',
                   'Julio 2026','Agosto 2026','Septiembre 2026','Octubre 2026','Noviembre 2026','Diciembre 2026']

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

function HorarioForm({ initial, onSave, onClose, sedes, meses }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.mes || !form.fecha || !form.horario || !form.sede || !form.materia || !form.profesor) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    setSaving(true)
    const { error } = await upsertHorario(form)
    if (error) setError(error.message)
    else { onSave(); onClose() }
    setSaving(false)
  }

  const Field = ({ label, k, type='text', options, required }) => (
    <div className="form-field">
      <label>{label}{required && <span className="req">*</span>}</label>
      {options ? (
        <select value={form[k]} onChange={e => set(k, e.target.value)}>
          <option value="">— Seleccioná —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} />
      )}
    </div>
  )

  return (
    <div className="horario-form">
      <div className="form-grid">
        <Field label="Mes"      k="mes"     options={MES_ORDER} required />
        <Field label="Fecha"    k="fecha"   required />
        <Field label="Horario"  k="horario" options={HORARIOS}  required />
        <Field label="Sede"     k="sede"    options={sedes}     required />
        <Field label="Cohorte"  k="cohorte" />
        <Field label="Cuatrimestre/Clase" k="cuatrimestre_clase" />
        <Field label="Materia"  k="materia"  required />
        <Field label="Profesor" k="profesor" required />
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

export default function Horarios() {
  const { isAdmin } = useAuth()
  const [filters, setFilters] = useState({})
  const [search, setSearch] = useState('')
  const { data, loading, refetch } = useHorarios(filters)
  const { sedes, meses, horarios, profesores } = useDistinctValues()

  const [modal, setModal] = useState(null) // null | 'new' | {record}
  const [deleting, setDeleting] = useState(null)

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v || undefined }))

  const filtered = search
    ? data.filter(r =>
        r.materia?.toLowerCase().includes(search.toLowerCase()) ||
        r.profesor?.toLowerCase().includes(search.toLowerCase()) ||
        r.cohorte?.toLowerCase().includes(search.toLowerCase())
      )
    : data

  const handleDelete = async (id) => {
    await deleteHorario(id)
    setDeleting(null)
    refetch()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Horarios</h1>
          <p className="page-subtitle">{filtered.length} registros encontrados</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setModal('new')}>
            <Plus size={16} /> Nueva clase
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={15} />
          <input
            placeholder="Buscar por materia, profesor, cohorte..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <select onChange={e => setFilter('mes', e.target.value)}>
          <option value="">Todos los meses</option>
          {MES_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select onChange={e => setFilter('sede', e.target.value)}>
          <option value="">Todas las sedes</option>
          {sedes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select onChange={e => setFilter('horario', e.target.value)}>
          <option value="">Todos los horarios</option>
          {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        {loading ? (
          <div className="table-loading"><span className="spinner" />Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mes</th><th>Fecha</th><th>Horario</th><th>Sede</th>
                <th>Cohorte</th><th>Cuat./Clase</th><th>Materia</th><th>Profesor</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 9 : 8} className="empty-row">Sin resultados</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td><span className="badge-mes">{r.mes?.replace(' 2026','')}</span></td>
                  <td>{r.fecha}</td>
                  <td><span className="badge-hora">{r.horario}</span></td>
                  <td className="fw-medium">{r.sede}</td>
                  <td className="text-sm text-muted">{r.cohorte}</td>
                  <td className="text-center">{r.cuatrimestre_clase}</td>
                  <td>{r.materia}</td>
                  <td>{r.profesor}</td>
                  {isAdmin && (
                    <td className="actions-cell">
                      <button className="icon-btn edit" onClick={() => setModal(r)} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn del" onClick={() => setDeleting(r)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal ABM */}
      {modal && (
        <Modal
          title={modal === 'new' ? 'Nueva clase' : 'Editar clase'}
          onClose={() => setModal(null)}
        >
          <HorarioForm
            initial={modal !== 'new' ? modal : null}
            sedes={sedes}
            meses={meses}
            onSave={refetch}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Confirm delete */}
      {deleting && (
        <Modal title="Eliminar clase" onClose={() => setDeleting(null)}>
          <div className="confirm-delete">
            <p>¿Eliminás la clase <strong>{deleting.materia}</strong> del {deleting.fecha}?</p>
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
