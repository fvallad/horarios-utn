import { useAuditLog } from '../hooks/useHorarios'

const ACCION_COLOR = { INSERT: 'log-insert', UPDATE: 'log-update', DELETE: 'log-delete' }
const ACCION_LABEL = { INSERT: 'Creó', UPDATE: 'Modificó', DELETE: 'Eliminó' }

export default function AuditLog() {
  const { data, loading } = useAuditLog()

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Registro de cambios</h1>
          <p className="page-subtitle">Últimas {data.length} acciones en el sistema</p>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="table-loading"><span className="spinner" />Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Sección</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={5} className="empty-row">No hay registros aún</td></tr>
              ) : data.map(r => (
                <tr key={r.id}>
                  <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleString('es-AR')}
                  </td>
                  <td className="fw-medium">{r.user_email}</td>
                  <td>
                    <span className={`log-badge ${ACCION_COLOR[r.accion] || ''}`}>
                      {ACCION_LABEL[r.accion] || r.accion}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{r.tabla}</td>
                  <td className="text-sm text-muted" style={{ maxWidth: 300 }}>
                    {r.detalle?.materia || r.detalle?.nombre || `ID ${r.registro_id}`}
                    {r.detalle?.profesor ? ` — ${r.detalle.profesor}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
