# LabCode — Plataforma de Entrenamiento en Programación

Plataforma gamificada de aprendizaje de programación con IA, paths de carrera y plan de entrenamiento diario personalizado.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Auth & DB**: Supabase (email/password + Google OAuth)
- **IA**: DeepSeek API (mentor socrático, diagnóstico, plan diario)
- **Deploy**: Vercel

## Setup local

```bash
cd frontend
cp .env.example .env   # Rellena con tus claves
npm install
npm run dev
```

## Variables de entorno

Ver `frontend/.env.example` para la lista completa.  
Añade las mismas variables en Vercel → Project Settings → Environment Variables.

## Supabase — SQL para crear la tabla

Ejecuta esto en Supabase → SQL Editor:

```sql
create table public.user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  progress jsonb default '{}',
  selected_path text,
  self_assessments jsonb default '{}',
  knowledge_profile jsonb,
  completed_sessions jsonb default '[]',
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

create policy "Users manage own data"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Google OAuth (opcional)

1. Supabase Dashboard → Authentication → Providers → Google → Enable
2. Crear credenciales OAuth en [Google Console](https://console.cloud.google.com/)
3. Añadir el Client ID y Secret en Supabase
4. Añadir en Google Console → Authorized redirect URIs:  
   `https://[tu-proyecto].supabase.co/auth/v1/callback`

## Deploy en Vercel

1. Sube el repo a GitHub
2. Entra en [vercel.com](https://vercel.com) → New Project → importa el repo
3. Root Directory: `frontend`
4. Framework: Vite (detección automática)
5. Añade las variables de entorno
6. Deploy

Después del primer deploy, añade la URL de Vercel en:  
Supabase → Authentication → URL Configuration → Site URL y Redirect URLs
