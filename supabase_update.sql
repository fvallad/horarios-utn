-- ============================================================
-- NUEVAS TABLAS — ejecutá en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de profesores
create table if not exists public.profesores (
  id         bigserial primary key,
  nombre     text not null unique,
  email      text,
  activo     boolean default true,
  created_at timestamptz default now()
);

alter table public.profesores enable row level security;

create policy "Lectura autenticados prof"
  on public.profesores for select
  using (auth.role() = 'authenticated');

create policy "Escritura admins prof"
  on public.profesores for all
  using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Poblar con los profesores existentes en horarios
insert into public.profesores (nombre)
select distinct profesor from public.horarios
where profesor != ''
order by profesor
on conflict (nombre) do nothing;

-- 2. Log de auditoría
create table if not exists public.audit_log (
  id          bigserial primary key,
  user_id     uuid references auth.users(id),
  user_email  text,
  accion      text not null,  -- 'INSERT' | 'UPDATE' | 'DELETE'
  tabla       text not null,
  registro_id bigint,
  detalle     jsonb,
  created_at  timestamptz default now()
);

alter table public.audit_log enable row level security;

create policy "Solo admins ven log"
  on public.audit_log for select
  using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Cualquier autenticado puede insertar log"
  on public.audit_log for insert
  with check (auth.role() = 'authenticated');

-- 3. Vista de usuarios (para el ABM de usuarios)
-- Supabase no expone auth.users directamente, usamos una función
create or replace function public.get_users()
returns table (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql security definer
as $$
  select
    id,
    email,
    coalesce(raw_user_meta_data->>'role', 'consulta') as role,
    created_at,
    last_sign_in_at
  from auth.users
  order by created_at desc;
$$;

-- Función para actualizar el rol de un usuario
create or replace function public.set_user_role(user_id uuid, new_role text)
returns void
language sql security definer
as $$
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  where id = user_id;
$$;

-- Función para eliminar usuario
create or replace function public.delete_user(user_id uuid)
returns void
language sql security definer
as $$
  delete from auth.users where id = user_id;
$$;
