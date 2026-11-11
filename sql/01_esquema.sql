-- Mapa de activos hoteleros Realtyplus · Investplus (v2)
-- Tabla pública de activos: solo ciudad (sin dirección exacta ni fotos), textos en español e inglés.
-- Lectura pública de los activos publicados; alta, edición y baja solo para usuarios autenticados (panel /admin).

create table if not exists public.activos (
  id              uuid primary key default gen_random_uuid(),
  referencia      text not null unique,
  pais            text not null,
  pais_en         text,
  ciudad          text not null,
  region          text,
  lat             double precision not null check (lat between -90 and 90),
  lng             double precision not null check (lng between -180 and 180),
  tipo_clave      text not null default 'hotel' check (tipo_clave in ('hotel','obra','reforma','suelo','otros')),
  tipo_es         text not null,
  tipo_en         text,
  categoria_es    text,
  categoria_en    text,
  habitaciones_es text,
  habitaciones_en text,
  precio          numeric(16,2) check (precio is null or precio >= 0),
  moneda          text not null default 'USD' check (moneda in ('USD','EUR')),
  operacion_es    text,
  operacion_en    text,
  estado_es       text,
  estado_en       text,
  descripcion_es  text,
  descripcion_en  text,
  publicado       boolean not null default true,
  orden           integer not null default 0,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create or replace function public.tocar_actualizado() returns trigger
language plpgsql set search_path = '' as $$
begin new.actualizado_en := now(); return new; end $$;

drop trigger if exists activos_actualizado on public.activos;
create trigger activos_actualizado before update on public.activos
  for each row execute function public.tocar_actualizado();

alter table public.activos enable row level security;

drop policy if exists "lectura publica" on public.activos;
create policy "lectura publica" on public.activos
  for select to anon, authenticated using (publicado or (select auth.role()) = 'authenticated');

drop policy if exists "admin inserta" on public.activos;
create policy "admin inserta" on public.activos for insert to authenticated with check (true);
drop policy if exists "admin edita" on public.activos;
create policy "admin edita" on public.activos for update to authenticated using (true) with check (true);
drop policy if exists "admin borra" on public.activos;
create policy "admin borra" on public.activos for delete to authenticated using (true);

create index if not exists activos_orden_idx on public.activos (orden, referencia);
