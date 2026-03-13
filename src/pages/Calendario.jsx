import { useState, useMemo } from 'react'
import { useHorarios, useDistinctValues } from '../hooks/useHorarios'

const HORARIOS = ['9 a 12', '13 a 16', '16 a 19', '19 a 22']
const MES_ORDER = ['Febrero 2026','Marzo 2026','Abril 2026','Mayo 2026','Junio 2026',
                   'Julio 2026','Agosto 2026','Septiembre 2026','Octubre 2026','Noviembre 2026','Diciembre 2026']

export default function Calendario() {
  const [mesFiltro, setMesFiltro] = useState('')
  const [sedeFiltro, setSedeFiltro] = useState('')
  const { data, loading } = useHorarios({ mes: mesFiltro || undefined, sede: sedeFiltro || undefined })
  const { sedes } = useDistinctValues()

  // Group by fecha → horario → list of clases
  const grid = useMemo(() => {
    const fechas = [...new Set(data.map(r => r.fecha))].sort()
    return fechas.map(fecha => ({
      fecha,
      slots: HORARIOS.map(h => ({
        horario: h,
        clases: data.filter(r => r.fecha === fecha && r.horario === h)
      })).filter(s => s.clases.length > 0)
    })).filter(f => f.slots.length > 0)
  }, [data])

  if (loading) return <div className="page-loading"><span className="spinner" />Cargando...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Calendario</h1>
          <p className="page-subtitle">Grilla semanal de clases</p>
        </div>
        <div className="filters-inline">
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
            <option value="">Todos los meses</option>
            {MES_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={sedeFiltro} onChange={e => setSedeFiltro(e.target.value)}>
            <option value="">Todas las sedes</option>
            {sedes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {grid.length === 0 ? (
        <div className="empty-state">No hay clases para los filtros seleccionados.</div>
      ) : (
        <div className="calendario">
          {grid.map(({ fecha, slots }) => (
            <div key={fecha} className="cal-dia">
              <div className="cal-fecha-header">
                <span className="cal-dia-nombre">{fecha}</span>
                <span className="cal-badge">{slots.reduce((a,s) => a + s.clases.length, 0)} clases</span>
              </div>
              <div className="cal-slots">
                {slots.map(({ horario, clases }) => (
                  <div key={horario} className="cal-slot">
                    <div className="cal-hora">{horario}</div>
                    <div className="cal-clases">
                      {clases.map((c, i) => (
                        <div key={i} className={`cal-clase sede-${c.sede?.replace(/\s+/g,'_').toLowerCase().slice(0,6)}`}>
                          <span className="cal-sede">{c.sede}</span>
                          <span className="cal-cohorte">{c.cohorte}</span>
                          <span className="cal-materia">{c.materia}</span>
                          <span className="cal-prof">{c.profesor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
