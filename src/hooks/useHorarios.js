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
  }, [JSON.stringify(filters)])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useDistinctValues() {
  const [values, setValues] = useState({ sedes: [], meses: [], horarios: [], profesores: [] })

  useEffect(() => {
    async function load() {
      const [sedes, meses, horarios, profesores] = await Promise.all([
        supabase.from('horarios').select('sede').order('sede'),
        supabase.from('horarios').select('mes').order('mes'),
        supabase.from('horarios').select('horario').order('horario'),
        supabase.from('horarios').select('profesor').order('profesor'),
      ])
      setValues({
        sedes:     [...new Set(sedes.data?.map(r => r.sede))],
        meses:     [...new Set(meses.data?.map(r => r.mes))],
        horarios:  [...new Set(horarios.data?.map(r => r.horario))],
        profesores:[...new Set(profesores.data?.map(r => r.profesor))],
      })
    }
    load()
  }, [])

  return values
}

export async function upsertHorario(record) {
  if (record.id) {
    return supabase.from('horarios').update(record).eq('id', record.id)
  }
  return supabase.from('horarios').insert(record)
}

export async function deleteHorario(id) {
  return supabase.from('horarios').delete().eq('id', id)
}
