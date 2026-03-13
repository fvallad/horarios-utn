import { useState, useMemo } from 'react'
import { useHorarios, useDistinctValues, upsertHorario, deleteHorario } from '../hooks/useHorarios'
import { useAuth } from '../hooks/useAuth'
import { Search, Plus, Edit2, Trash2, X, Check, ChevronUp, ChevronDown } from 'lucide-react'

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

function HorarioForm({ initial, onSave, onClose, sedes, profesores }) {
  const { user } = useAuth()
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profSearch, setProfSearch] = useState(initial?.profesor || '')
  const [profOpen, setProfOpen] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const filteredProfs = profesores.filter(p =>
    p.toLowerCase().includes(profSearch.toLowerCase())
  )

  const selectProf = (nombre) => {
    set('profesor', nombre)
    setProfSearch(nombre)
    setProfOpen(false)
  }

  const handleSave = async () => {
    if (!form.mes || !form.fecha || !form.horario || !form.sede || !form.materia || !form.profesor) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    setSaving(true)
    const { error } = await upsertHorario(form, user)
    if (error) setError(error.message)
    else { onSave(); onClose() }
    setSaving(false)
  }

  const SelectField = ({ label, k, options, required }) => (
    <div className="form-field">
      <label>{label}{required && <span className="req">*</span>}</label>
      <select value={form[k]} onChange={e => set(k, e.target.value)}>
        <option value="">— Seleccioná —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  const TextField = ({ label, k, required }) => (
    <div className="form-field">
      <label>{label}{required && <span className="req">*</span>}</label>
      <input type="text" value={form[k]} onChange={e => set(k, e.target.value)} />
    </div>
  )

  return (
    <div className="horario-form">
      <div className="form-grid">
        <SelectField label="Mes"     k="mes"     options={MES_ORDER} required />
        <TextField   label="Fecha"   k="fecha"   required />
        <SelectField label="Horario" k="horario" options={HORARIOS}  required />
        <SelectField label="Sede"    k="sede"    options={sedes}     required />
        <TextField   label="Cohorte" k="cohorte" />
        <TextField   label="Cuatrimestre/Clase" k="cuatrimestre_clase" />
        <TextField   label="Materia" k="materia" required />

        {/* Profesor con búsqueda/desplegable */}
        <div className="form-field" style={{ position: 'relative' }}>
          <label>Profesor<span className="req">*</span></label>
          <input
            type="text"
            value={profSearch}
            placeholder="Buscar profesor..."
            onChange={e => { setProfSearch(e.target.value); set('profesor', e.target.value); setProfOpen(true) }}
            onFocus={() => setProfOpen(true)}
            autoComplete="off"
          />
          {profOpen && filteredProfs.length > 0 && (
            <div className="prof-dropdown">
              {filteredProfs.slice(0, 8).map(p => (
                <div key={p} className="prof-dropdown-item" onMouseDown={() => selectProf(p)}>
                  {p}
                </div>
              ))}
            </div>
          )}
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

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <span className="sort-icon inactive"><ChevronUp size={12} /></span>
  return sortDir === 'asc'
    ? <ChevronUp size={13} className="sort-icon active" />
    : <ChevronDown size={13} className="sort-icon active" />
}

export default function Horarios() {
  const { isAdmin, user } = useAuth()
  const [filters, setFilters] = useState({})
  const [search, setSearch] = useState('')
  const { data, loading, refetch } = useHorarios(filters)
  const { sedes, horarios, profesores } = useDistinctValues()

  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v || undefined }))

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let rows = search
      ? data.filter(r =>
          r.materia?.toLowerCase().includes(search.toLowerCase()) ||
          r.profesor?.toLowerCase().includes(search.toLowerCase()) ||
          r.cohorte?.toLowerCase().includes(search.toLowerCase())
        )
      : data

    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        const av = (a[sortCol] || '').toString().toLowerCase()
        const bv = (b[sortCol] || '').toString().toLowerCase()
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }
    return rows
  }, [data, search, sortCol, sortDir])

  const handleDelete = async (id) => {
    await deleteHorario(id, user)
    setDeleting(null)
    refetch()
  }

  const cols = [
    { key: 'mes',               label: 'Mes' },
    { key: 'fecha',             label: 'Fecha' },
    { key: 'horario',           label: 'Horario' },
    { key: 'sede',              label: 'Sede' },
    { key: 'cohorte',           label: 'Cohorte' },
    { key: 'cuatrimestre_clase',label: 'Cuat./Clase' },
    { key: 'materia',           label: 'Materia' },
    { key: 'profesor',          label: 'Profesor' },
  ]

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

      <div className="table-wrapper">
        {loading ? (
          <div className="table-loading"><span className="spinner" />Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {cols.map(c => (
                  <th key={c.key} className="sortable-th" onClick={() => handleSort(c.key)}>
                    <span className="th-inner">
                      {c.label}
                      <SortIcon col={c.key} sortCol={sortCol} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
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
                      <button className="icon-btn edit" onClick={() => setModal(r)}><Edit2 size={14} /></button>
                      <button className="icon-btn del" onClick={() => setDeleting(r)}><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'new' ? 'Nueva clase' : 'Editar clase'} onClose={() => setModal(null)}>
          <HorarioForm
            initial={modal !== 'new' ? modal : null}
            sedes={sedes}
            profesores={profesores}
            onSave={refetch}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

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
