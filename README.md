# Profesorado UTN — Cronograma 2026

Sistema web para gestión de horarios del Profesorado UTN con roles de admin y consulta.

---

## Stack

- **Frontend**: React 18 + React Router
- **Base de datos + Auth**: Supabase (gratuito)
- **Deploy**: Vercel (gratuito)

---

## Paso a paso para publicar

### 1. Configurar Supabase

1. Creá el proyecto en [supabase.com](https://supabase.com)
2. Andá a **SQL Editor** y ejecutá todo el contenido de `supabase_setup.sql`
3. En **Settings → API** copiá:
   - `Project URL`
   - `anon public` key (para el frontend)
   - `service_role` key (solo para cargar datos, no va al frontend)

### 2. Crear usuarios

En **Authentication → Users → Add user**:

- Usuario admin: poné email + password y en **User Metadata** escribí:
  ```json
  { "role": "admin" }
  ```
- Usuario de consulta: igual pero:
  ```json
  { "role": "consulta" }
  ```

### 3. Cargar los datos del Excel

```bash
pip install supabase pandas openpyxl
```

Editá `cargar_datos.py` y completá:
```python
SUPABASE_URL = "https://cknifwdwtenhfwfvkwyw.supabase.co"
SUPABASE_KEY = "TU_SERVICE_ROLE_KEY"
EXCEL_PATH   = "Horarios2026.xlsx"
```

Luego ejecutá:
```bash
python cargar_datos.py
```

### 4. Deploy en Vercel

1. Subí esta carpeta a un repositorio de GitHub
2. En [vercel.com](https://vercel.com) → **New Project** → importá el repo
3. En **Environment Variables** agregá:
   - `REACT_APP_SUPABASE_URL` → tu Project URL
   - `REACT_APP_SUPABASE_ANON_KEY` → tu anon key
4. Hacé click en **Deploy**

¡Listo! Vercel te da una URL pública.

---

## Funcionalidades

| Vista         | Admin | Consulta |
|---------------|-------|----------|
| Dashboard     | ✅    | ✅       |
| Tabla filtros | ✅    | ✅       |
| ABM clases    | ✅    | ❌       |
| Calendario    | ✅    | ✅       |
| Por profesor  | ✅    | ✅       |

---

## Desarrollo local

```bash
cp .env.example .env.local
# Editá .env.local con tus claves

npm install
npm start
```
