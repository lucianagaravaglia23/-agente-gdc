-- Esquema Supabase para "Agente GDC"
-- Correr completo en el SQL Editor del dashboard de Supabase (Project → SQL Editor → New query).

create extension if not exists pgcrypto;

create table proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  area text not null,
  estado text not null default 'En diagnóstico'
    check (estado in ('En diagnóstico','En curso','Completado','Cancelado')),
  nivel_calculado text check (nivel_calculado in ('ALTO','MEDIO','BAJO')),
  score_caracteristicas_del_cambio integer,
  score_atributos_organizacionales integer,
  creado_en timestamptz not null default now(),
  plan_generado_en timestamptz,
  cancelado_motivo text,
  cancelado_por text,
  cancelado_en timestamptz,
  personas_involucradas_ids text[] not null default '{}'
);

create table respuestas_diagnostico (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  bloque text not null check (bloque in ('Características del Cambio','Atributos Organizacionales')),
  numero_pregunta integer not null,
  valor integer not null check (valor between 1 and 5),
  unique (proyecto_id, bloque, numero_pregunta)
);

create table tareas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  etapa text not null check (etapa in ('Preparar el Cambio','Gestionar el Cambio','Reforzar el Cambio')),
  nombre text not null,
  responsable_rol text not null
    check (responsable_rol in ('Equipo Experto de GDC','Embajadores / Staffing Dinámico','Embajadores de Red de Cambio','Líder de Gestión del Cambio')),
  persona_asignada_id text,
  asignacion_manual boolean not null default false,
  estado text not null default 'Pendiente'
    check (estado in ('Pendiente','En progreso','Completada','Bloqueada')),
  escalada boolean not null default false,
  orden integer not null default 0
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  tarea_id uuid references tareas(id) on delete set null,
  usuario text not null default 'Demo',
  creado_en timestamptz not null default now(),
  tipo_evento text not null
    check (tipo_evento in ('estado_tarea','reasignacion','cancelacion_proyecto','escalamiento','plan_generado')),
  detalle text not null,
  valor_anterior text,
  valor_nuevo text
);

create table question_escalations (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  question_id text not null,
  pregunta_texto text not null,
  consulta text not null,
  usuario text not null default 'Demo',
  creado_en timestamptz not null default now(),
  estado text not null default 'abierta' check (estado in ('abierta','resuelta')),
  respuesta text,
  respondido_por text,
  respondido_en timestamptz
);

alter table proyectos enable row level security;
alter table respuestas_diagnostico enable row level security;
alter table tareas enable row level security;
alter table audit_log enable row level security;
alter table question_escalations enable row level security;

create policy "auth_full_access" on proyectos
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_full_access" on respuestas_diagnostico
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_full_access" on tareas
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_full_access" on audit_log
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_full_access" on question_escalations
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
