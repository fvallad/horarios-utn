import { useHorarios } from '../hooks/useHorarios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#1a3a6b','#2e75b6','#4a9fd4','#70b8e8','#a0d4f5','#c8e8fa',
                 '#0d4f3c','#1a7a5e','#2eaa84','#5bc8a8']

const MES_ORDER = ['Febrero 2026','Marzo 2026','Abril 2026','Mayo 2026',
                   'Junio 2026','Julio 2026','Agosto 2026','Septiembre 2026',
                   'Octubre 2026','Noviembre 2026','Diciembre 2026']

export default function Dashboard() {
  const { data, loading } = useHorarios()

  if (loading) return <div className="page-loading"><span className="spinner" />Cargando datos...</div>

  // Clases por sede
  const bySede = Object.entries(
    data.reduce((acc, r) => { acc[r.sede] = (acc[r.sede] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)

  // Clases por mes
  const byMes = MES_ORDER
    .map(mes => ({ mes: mes.replace(' 2026',''), value: data.filter(r => r.mes === mes).length }))
    .filter(r => r.value > 0)

  // Clases por horario
  const byHorario = Object.entries(
    data.reduce((acc, r) => { acc[r.horario] = (acc[r.horario] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  // Top profesores
  const byProf = Object.entries(
    data.reduce((acc, r) => { acc[r.profesor] = (acc[r.profesor] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name: name.split(',')[0], value }))
    .sort((a,b) => b.value - a.value).slice(0, 10)

  const stats = [
    { label: 'Clases totales', value: data.length, icon: '📚' },
    { label: 'Sedes activas', value: bySede.length, icon: '🏛️' },
    { label: 'Profesores', value: new Set(data.map(r => r.profesor)).size, icon: '👩‍🏫' },
    { label: 'Materias', value: new Set(data.map(r => r.materia)).size, icon: '📖' },
  ]

  return (
    <div className="page dashboard">
      <div className="page-header">
        <h1>Panel de control</h1>
        <p className="page-subtitle">Cronograma Ciclo Lectivo 2026</p>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card wide">
          <h3>Clases por mes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.12)' }} />
              <Bar dataKey="value" fill="#2e75b6" radius={[4,4,0,0]} name="Clases" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Distribución por sede</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={bySede} cx="50%" cy="50%" outerRadius={80}
                dataKey="value" nameKey="name" label={({ name, percent }) =>
                  `${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}
                labelLine={false} fontSize={10}>
                {bySede.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Clases por banda horaria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byHorario} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" nameKey="name">
                {byHorario.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card wide">
          <h3>Top 10 profesores con más clases</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byProf} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.12)' }} />
              <Bar dataKey="value" fill="#1a3a6b" radius={[0,4,4,0]} name="Clases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
