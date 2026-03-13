import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHorarios(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('horarios').select('*').order('mes').order('fecha').order('horario')
    if (filters.sede)     query = query.eq('sede', filters.sede)
    if (filters.profesor) query = query.ilike('profesor', `%${filters.profesor}%`)
    if (filters.materia)  query = query.ilike('materia', `%${filters.materia}%`)
    if (filters.mes)      query = query.eq('mes', filters.mes)
    if (filters.horario)  query = query.eq('horario', filters.horario)
    if (filters.cohorte)  query = query.ilike('cohorte', `%${filters.cohorte}%`)
    const { data, error } = await query
    if (error) setError(error)
    else setData(data)
    setLoading(false)
  }, [JSON.stringify(filters)]) // eslint-disable-line

  useEffect(() => { fetchData() }, [fetchData])
  return { data, loading, error, refetch: fetchData }
}

export function useDistinctValues() {
  const [values, setValues] = useState({ sedes: [], meses: [], horarios: [], profesores: [] })
  useEffect(() => {
    async function load() {
      const [sedes, meses, horarios, profs] = await Promise.all([
        supabase.from('horarios').select('sede').order('sede'),
        supabase.from('horarios').select('mes').order('mes'),
        supabase.from('horarios').select('horario').order('horario'),
        supabase.from('profesores').select('nombre').eq('activo', true).order('nombre'),
      ])
      setValues({
        sedes:     [...new Set(sedes.data?.map(r => r.sede))],
        meses:     [...new Set(meses.data?.map(r => r.mes))],
        horarios:  [...new Set(horarios.data?.map(r => r.horario))],
        profesores: profs.data?.map(r => r.nombre) || [],
      })
    }
    load()
  }, [])
  return values
}

export function useProfesoresList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profesores').select('*').order('nombre')
    setData(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  return { data, loading, refetch: fetchData }
}

export function useAuditLog() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setData(data || [])
      setLoading(false)
    }
    load()
  }, [])
  return { data, loading }
}

export async function writeAuditLog(user, accion, tabla, registro_id, detalle) {
  await supabase.from('audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    accion,
    tabla,
    registro_id,
    detalle,
  })
}

export async function upsertHorario(record, user) {
  const isUpdate = !!record.id
  const { data, error } = isUpdate
    ? await supabase.from('horarios').update(record).eq('id', record.id).select().single()
    : await supabase.from('horarios').insert(record).select().single()
  if (!error && user) {
    await writeAuditLog(user, isUpdate ? 'UPDATE' : 'INSERT', 'horarios', data?.id, record)
  }
  return { data, error }
}

export async function deleteHorario(id, user) {
  const { error } = await supabase.from('horarios').delete().eq('id', id)
  if (!error && user) {
    await writeAuditLog(user, 'DELETE', 'horarios', id, { id })
  }
  return { error }
}

export async function upsertProfesor(record, user) {
  const isUpdate = !!record.id
  const { data, error } = isUpdate
    ? await supabase.from('profesores').update(record).eq('id', record.id).select().single()
    : await supabase.from('profesores').insert(record).select().single()
  if (!error && user) {
    await writeAuditLog(user, isUpdate ? 'UPDATE' : 'INSERT', 'profesores', data?.id, record)
  }
  return { data, error }
}

export async function deleteProfesor(id, user) {
  const { error } = await supabase.from('profesores').delete().eq('id', id)
  if (!error && user) {
    await writeAuditLog(user, 'DELETE', 'profesores', id, { id })
  }
  return { error }
}
