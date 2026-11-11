-- Mapa de activos hoteleros Realtyplus · Investplus (v2.1)
-- Una fila por activo. Solo ciudad (sin dirección exacta ni fotos).
-- Campos fijos como CÓDIGOS (tipo, categoria, operacion, estado, pais ISO): la web los traduce con assets/js/i18n.js.
-- Texto libre en español (descripcion, habitaciones) + traducciones automáticas en "traduccion" por idioma:
--   traduccion = {"en": {"descripcion": "...", "habitaciones": "..."}, "ru": {...}}
-- Seguridad (RLS): lectura pública de los publicados; crear/editar/borrar solo usuarios con login (panel /admin).

create table if not exists public.activos (
  id             uuid primary key default gen_random_uuid(),
  referencia     text not null unique,
  pais           text not null check (pais ~ '^[A-Z]{2}$'),          -- ISO 3166-1 alfa-2 (ES, AR, DO…)
  ciudad         text not null,
  region         text,                                               -- zona para el filtro
  lat            double precision not null check (lat between -90 and 90),
  lng            double precision not null check (lng between -180 and 180),
  tipo           text not null default 'hotel_operativo',            -- clave de RP_I18N.catalogos.tipo
  tipo_clave     text not null default 'hotel' check (tipo_clave in ('hotel','obra','reforma','suelo','otros')),  -- grupo/color
  categoria      text,                                               -- clave de catalogos.categoria
  habitaciones   text,                                               -- texto libre (ES)
  precio         numeric(16,2) check (precio is null or precio >= 0),
  moneda         text not null default 'USD' check (moneda in ('USD','EUR')),
  operacion      text,                                               -- clave de catalogos.operacion
  estado         text default 'disponible',                          -- clave de catalogos.estado
  descripcion    text,                                               -- texto libre (ES)
  traduccion     jsonb not null default '{}'::jsonb,
  publicado      boolean not null default true,
  orden          integer not null default 0,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
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

-- IMPORTANTE: en Authentication desactivar el registro público ("Allow new users to sign up" = off);
-- los usuarios del panel se crean a mano en Authentication > Users.
