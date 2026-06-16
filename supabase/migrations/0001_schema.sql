-- ============================================================================
-- Essence Academy — Esquema base (Fase 0)
-- Postgres / Supabase. PKs uuid (gen_random_uuid), created_at/updated_at.
-- Nombres de tablas y columnas en español.
-- ============================================================================

-- gen_random_uuid() vive en pgcrypto (disponible en Supabase por defecto).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Helper: mantener updated_at al día en cada UPDATE.
-- ----------------------------------------------------------------------------
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- PERFILES (extiende auth.users)
-- ============================================================================
create table public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text,
  email       text,
  rol         text not null default 'alumno'
              check (rol in ('admin', 'educador', 'alumno')),
  avatar_url  text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_perfiles_updated before update on public.perfiles
  for each row execute function public.tocar_updated_at();

-- Al crear un usuario en auth.users, generamos su perfil (rol alumno por
-- defecto; el flujo de canje de código puede elevarlo a educador).
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_auth_nuevo_usuario
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- ============================================================================
-- CURSOS
-- ============================================================================
create table public.cursos (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  slug         text not null unique,
  descripcion  text,
  portada_url  text,
  es_insignia  boolean not null default false,
  estado       text not null default 'borrador'
               check (estado in ('borrador', 'publicado', 'archivado')),
  orden        int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_cursos_updated before update on public.cursos
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- ETAPAS (secciones dentro de un curso; en 0a100: Origen/Criterio/Proyección)
-- ============================================================================
create table public.etapas (
  id          uuid primary key default gen_random_uuid(),
  curso_id    uuid not null references public.cursos(id) on delete cascade,
  nombre      text not null,
  descripcion text,
  orden       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_etapas_curso on public.etapas(curso_id);
create trigger trg_etapas_updated before update on public.etapas
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- MODULOS (agrupador opcional dentro de una etapa)
-- ============================================================================
create table public.modulos (
  id         uuid primary key default gen_random_uuid(),
  etapa_id   uuid not null references public.etapas(id) on delete cascade,
  titulo     text not null,
  orden      int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_modulos_etapa on public.modulos(etapa_id);
create trigger trg_modulos_updated before update on public.modulos
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- LECCIONES (cuelgan de una etapa; modulo_id opcional)
-- ============================================================================
create table public.lecciones (
  id          uuid primary key default gen_random_uuid(),
  etapa_id    uuid not null references public.etapas(id) on delete cascade,
  modulo_id   uuid references public.modulos(id) on delete set null,
  titulo      text not null,
  descripcion text,
  orden       int not null default 0,
  publicada   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_lecciones_etapa on public.lecciones(etapa_id);
create index idx_lecciones_modulo on public.lecciones(modulo_id);
create trigger trg_lecciones_updated before update on public.lecciones
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- RECURSOS (video | pdf | imagen | texto) — varios por lección y mezclables
-- ============================================================================
create table public.recursos (
  id               uuid primary key default gen_random_uuid(),
  leccion_id       uuid not null references public.lecciones(id) on delete cascade,
  tipo             text not null
                   check (tipo in ('video', 'pdf', 'imagen', 'texto')),
  -- Solo aplica a video: si es archivo subido o embed externo.
  tipo_fuente      text check (tipo_fuente in ('upload', 'embed')),
  titulo           text not null,
  -- Path en Storage (upload) o URL (embed/pdf/imagen).
  url_archivo      text,
  proveedor_embed  text check (proveedor_embed in ('youtube', 'vimeo')),
  -- HTML/markdown para tipo 'texto'.
  contenido_texto  text,
  orden            int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Si es video embed, debe declarar proveedor.
  constraint chk_recurso_embed
    check (tipo_fuente is distinct from 'embed' or proveedor_embed is not null)
);
create index idx_recursos_leccion on public.recursos(leccion_id);
create trigger trg_recursos_updated before update on public.recursos
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- QUIZZES (1 por lección)
-- ============================================================================
create table public.quizzes (
  id                     uuid primary key default gen_random_uuid(),
  leccion_id             uuid not null unique references public.lecciones(id) on delete cascade,
  titulo                 text not null,
  puntaje_minimo_aprobar int not null default 60
                         check (puntaje_minimo_aprobar between 0 and 100),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger trg_quizzes_updated before update on public.quizzes
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- PREGUNTAS_QUIZ
-- ============================================================================
create table public.preguntas_quiz (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references public.quizzes(id) on delete cascade,
  enunciado  text not null,
  tipo       text not null
             check (tipo in ('opcion_unica', 'opcion_multiple', 'verdadero_falso')),
  orden      int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_preguntas_quiz on public.preguntas_quiz(quiz_id);
create trigger trg_preguntas_updated before update on public.preguntas_quiz
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- OPCIONES_PREGUNTA  (es_correcta NUNCA se expone al alumno; ver vista abajo)
-- ============================================================================
create table public.opciones_pregunta (
  id          uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.preguntas_quiz(id) on delete cascade,
  texto       text not null,
  es_correcta boolean not null default false,
  orden       int not null default 0
);
create index idx_opciones_pregunta on public.opciones_pregunta(pregunta_id);

-- ============================================================================
-- INSCRIPCIONES (control de acceso del alumno a un curso)
-- ============================================================================
create table public.inscripciones (
  id                 uuid primary key default gen_random_uuid(),
  alumno_id          uuid not null references public.perfiles(id) on delete cascade,
  curso_id           uuid not null references public.cursos(id) on delete cascade,
  estado             text not null default 'activa'
                     check (estado in ('activa', 'pausada', 'revocada')),
  inscripto_por      uuid references public.perfiles(id) on delete set null,
  fecha_inscripcion  timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (alumno_id, curso_id)
);
create index idx_inscripciones_alumno on public.inscripciones(alumno_id);
create index idx_inscripciones_curso on public.inscripciones(curso_id);
create trigger trg_inscripciones_updated before update on public.inscripciones
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- CODIGOS_INVITACION
-- ============================================================================
create table public.codigos_invitacion (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,
  curso_id      uuid references public.cursos(id) on delete set null,
  rol_destino   text not null default 'alumno'
                check (rol_destino in ('alumno', 'educador')),
  usos_maximos  int,
  usos_actuales int not null default 0,
  expira_en     timestamptz,
  activo        boolean not null default true,
  creado_por    uuid references public.perfiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index idx_codigos_codigo on public.codigos_invitacion(codigo);

-- ============================================================================
-- PROGRESO_LECCIONES
-- ============================================================================
create table public.progreso_lecciones (
  id               uuid primary key default gen_random_uuid(),
  alumno_id        uuid not null references public.perfiles(id) on delete cascade,
  leccion_id       uuid not null references public.lecciones(id) on delete cascade,
  completada       boolean not null default false,
  fecha_completada timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (alumno_id, leccion_id)
);
create index idx_progreso_alumno on public.progreso_lecciones(alumno_id);
create trigger trg_progreso_updated before update on public.progreso_lecciones
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- INTENTOS_QUIZ
-- ============================================================================
create table public.intentos_quiz (
  id         uuid primary key default gen_random_uuid(),
  alumno_id  uuid not null references public.perfiles(id) on delete cascade,
  quiz_id    uuid not null references public.quizzes(id) on delete cascade,
  puntaje    int not null check (puntaje between 0 and 100),
  aprobado   boolean not null,
  respuestas jsonb not null default '{}'::jsonb,
  fecha      timestamptz not null default now()
);
create index idx_intentos_alumno on public.intentos_quiz(alumno_id);
create index idx_intentos_quiz on public.intentos_quiz(quiz_id);

-- ============================================================================
-- CERTIFICADOS
-- ============================================================================
create table public.certificados (
  id                  uuid primary key default gen_random_uuid(),
  alumno_id           uuid not null references public.perfiles(id) on delete cascade,
  curso_id            uuid not null references public.cursos(id) on delete cascade,
  codigo_verificacion text not null unique,
  fecha_emision       timestamptz not null default now(),
  url_pdf             text,
  unique (alumno_id, curso_id)
);
create index idx_certificados_alumno on public.certificados(alumno_id);

-- ============================================================================
-- PUBLICACIONES_COMUNIDAD
-- ============================================================================
create table public.publicaciones_comunidad (
  id         uuid primary key default gen_random_uuid(),
  autor_id   uuid not null references public.perfiles(id) on delete cascade,
  curso_id   uuid references public.cursos(id) on delete cascade,
  contenido  text not null,
  imagen_url text,
  fijada     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_publicaciones_curso on public.publicaciones_comunidad(curso_id);
create trigger trg_publicaciones_updated before update on public.publicaciones_comunidad
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- COMENTARIOS (comunidad y preguntas de lección)
-- ============================================================================
create table public.comentarios (
  id                  uuid primary key default gen_random_uuid(),
  autor_id            uuid not null references public.perfiles(id) on delete cascade,
  publicacion_id      uuid references public.publicaciones_comunidad(id) on delete cascade,
  leccion_id          uuid references public.lecciones(id) on delete cascade,
  contenido           text not null,
  comentario_padre_id uuid references public.comentarios(id) on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- Exactamente uno de (publicacion_id, leccion_id) debe estar seteado.
  constraint chk_comentario_destino
    check ((publicacion_id is not null)::int + (leccion_id is not null)::int = 1)
);
create index idx_comentarios_publicacion on public.comentarios(publicacion_id);
create index idx_comentarios_leccion on public.comentarios(leccion_id);
create index idx_comentarios_padre on public.comentarios(comentario_padre_id);
create trigger trg_comentarios_updated before update on public.comentarios
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- REACCIONES (me gusta)
-- ============================================================================
create table public.reacciones (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references public.perfiles(id) on delete cascade,
  publicacion_id uuid references public.publicaciones_comunidad(id) on delete cascade,
  comentario_id  uuid references public.comentarios(id) on delete cascade,
  created_at     timestamptz not null default now(),
  -- Exactamente uno de (publicacion_id, comentario_id) debe estar seteado.
  constraint chk_reaccion_destino
    check ((publicacion_id is not null)::int + (comentario_id is not null)::int = 1)
);
-- Una reacción por usuario y objeto.
create unique index uq_reaccion_publicacion
  on public.reacciones(usuario_id, publicacion_id) where publicacion_id is not null;
create unique index uq_reaccion_comentario
  on public.reacciones(usuario_id, comentario_id) where comentario_id is not null;
