-- ============================================================
-- 1. CREAR TABLA
-- ============================================================
create table if not exists public.horarios (
  id                 bigserial primary key,
  mes                text not null,
  fecha              text not null,
  horario            text not null,
  sede               text not null,
  cohorte            text,
  cuatrimestre_clase text,
  materia            text not null,
  profesor           text not null,
  created_at         timestamptz default now()
);

-- Índices para búsquedas rápidas
create index if not exists idx_horarios_sede     on public.horarios(sede);
create index if not exists idx_horarios_mes      on public.horarios(mes);
create index if not exists idx_horarios_profesor on public.horarios(profesor);
create index if not exists idx_horarios_horario  on public.horarios(horario);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================
alter table public.horarios enable row level security;

-- Cualquier usuario autenticado puede leer
create policy "Lectura autenticados"
  on public.horarios for select
  using (auth.role() = 'authenticated');

-- Solo admins pueden insertar, actualizar, eliminar
create policy "Escritura admins"
  on public.horarios for all
  using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 3. FUNCIÓN PARA ASIGNAR ROL AL CREAR USUARIO
-- ============================================================
-- Usala desde Supabase Dashboard > Authentication > Users
-- Al crear un usuario, en "User Metadata" poné: { "role": "admin" }
-- o { "role": "consulta" }

-- ============================================================
-- NOTAS
-- ============================================================
-- Después de ejecutar este SQL, corré el script Python
-- "cargar_datos.py" para importar los datos del Excel.
