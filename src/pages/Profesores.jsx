import { useState, useMemo } from 'react'
import { useHorarios } from '../hooks/useHorarios'
import { ChevronDown, ChevronRight, User } from 'lucide-react'

const MES_ORDER = ['Febrero 2026','Marzo 2026','Abril 2026','Mayo 2026','Junio 2026',
                   'Julio 2026','Agosto 2026','Septiembre 2026','Octubre 2026','Noviembre 2026','Diciembre 2026']

export default function Profesores() {
  const { data, loading } = useHorarios()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})

  const profesores = useMemo(() => {
    const map = {}
    data.forEach(r => {
      if (!map[r.profesor]) map[r.profesor] = []
      map[r.profesor].push(r)
    })
    return Object.entries(map)
      .map(([nombre, clases]) => ({
        nombre,
        clases,
        materias: [...new Set(clases.map(c => c.materia))],
        sedes:    [...new Set(clases.map(c => c.sede))],
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [data])

  const filtered = search
    ? profesores.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : profesores

  const toggle = (nombre) => setExpanded(e => ({ ...e, [nombre]: !e[nombre] }))

  const clasesPorMes = (clases) => {
    const map = {}
    clases.forEach(c => { map[c.mes] = (map[c.mes] || 0) + 1 })
    return MES_ORDER.filter(m => map[m]).map(m => ({ mes: m.replace(' 2026',''), n: map[m] }))
  }

  if (loading) return <div className="page-loading"><span className="spinner" />Cargando...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Vista por Profesor</h1>
          <p className="page-subtitle">{profesores.length} profesores en el ciclo lectivo</p>
        </div>
        <div className="search-box">
          <User size={15} />
          <input
            placeholder="Buscar profesor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="prof-list">
        {filtered.map(p => (
          <div key={p.nombre} className={`prof-card ${expanded[p.nombre] ? 'expanded' : ''}`}>
            <div className="prof-header" onClick={() => toggle(p.nombre)}>
              <div className="prof-avatar">{p.nombre.split(',')[0].trim()[0]}</div>
              <div className="prof-info">
                <span className="prof-name">{p.nombre}</span>
                <div className="prof-tags">
                  {p.sedes.map(s => <span key={s} className="tag-sede">{s}</span>)}
                </div>
              </div>
              <div className="prof-stats">
                <span className="prof-stat"><strong>{p.clases.length}</strong> clases</span>
                <span className="prof-stat"><strong>{p.materias.length}</strong> materias</span>
              </div>
              <div className="prof-chevron">
                {expanded[p.nombre] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </div>

            {expanded[p.nombre] && (
              <div className="prof-detail">
                <div className="prof-detail-cols">
                  <div>
                    <h4>Materias que dicta</h4>
                    <ul className="materia-list">
                      {p.materias.map(m => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4>Clases por mes</h4>
                    <div className="mes-bars">
                      {clasesPorMes(p.clases).map(({ mes, n }) => (
                        <div key={mes} className="mes-bar-row">
                          <span className="mes-label">{mes}</span>
                          <div className="mes-bar-track">
                            <div className="mes-bar-fill" style={{ width: `${(n / p.clases.length) * 100}%` }} />
                          </div>
                          <span className="mes-count">{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <h4>Detalle de clases</h4>
                <table className="data-table compact">
                  <thead>
                    <tr><th>Mes</th><th>Fecha</th><th>Horario</th><th>Sede</th><th>Cohorte</th><th>Materia</th></tr>
                  </thead>
                  <tbody>
                    {p.clases
                      .sort((a,b) => MES_ORDER.indexOf(a.mes) - MES_ORDER.indexOf(b.mes))
                      .map((c, i) => (
                      <tr key={i}>
                        <td><span className="badge-mes">{c.mes?.replace(' 2026','')}</span></td>
                        <td>{c.fecha}</td>
                        <td><span className="badge-hora">{c.horario}</span></td>
                        <td>{c.sede}</td>
                        <td className="text-muted text-sm">{c.cohorte}</td>
                        <td>{c.materia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
