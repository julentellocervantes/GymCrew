-- Pégalo UNA vez en Supabase > SQL Editor > New query > Run.
-- Tabla donde el servidor guarda su base de datos (una fila).
create table if not exists public.gc_kv (
  key text primary key,
  val jsonb not null,
  updated_at timestamptz not null default now()
);
-- Sin políticas: solo el servidor (clave secreta) puede leer y escribir; la clave pública no puede.
alter table public.gc_kv enable row level security;

-- Cubo PRIVADO para fotos y vídeos (el servidor los entrega; nadie accede directo a Supabase).
insert into storage.buckets (id, name, public) values ('gcmedia', 'gcmedia', false)
on conflict (id) do nothing;
