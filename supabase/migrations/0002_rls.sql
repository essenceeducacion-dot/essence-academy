-- ============================================================================
-- Essence Academy — Row Level Security + helpers de autorización (Fase 0)
-- Defensa en profundidad: además de estos guards habrá guards en el servidor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helpers SECURITY DEFINER: corren con privilegios del owner, así evitan la
-- recursión de RLS al consultar `perfiles` desde las políticas.
-- ----------------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin' and activo
  );
$$;

create or replace function public.es_staff()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('admin', 'educador') and activo
  );
$$;

create or replace function public.tiene_inscripcion_activa(p_curso uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.inscripciones
    where alumno_id = auth.uid() and curso_id = p_curso and estado = 'activa'
  );
$$;

-- Resuelve el curso al que pertenece una lección (vía etapa).
create or replace function public.curso_de_leccion(p_leccion uuid)
returns uuid language sql security definer stable
set search_path = public as $$
  select e.curso_id
  from public.lecciones l
  join public.etapas e on e.id = l.etapa_id
  where l.id = p_leccion;
$$;

-- ----------------------------------------------------------------------------
-- Habilitar RLS en todas las tablas.
-- ----------------------------------------------------------------------------
alter table public.perfiles               enable row level security;
alter table public.cursos                 enable row level security;
alter table public.etapas                 enable row level security;
alter table public.modulos                enable row level security;
alter table public.lecciones              enable row level security;
alter table public.recursos               enable row level security;
alter table public.quizzes                enable row level security;
alter table public.preguntas_quiz         enable row level security;
alter table public.opciones_pregunta      enable row level security;
alter table public.inscripciones          enable row level security;
alter table public.codigos_invitacion     enable row level security;
alter table public.progreso_lecciones     enable row level security;
alter table public.intentos_quiz          enable row level security;
alter table public.certificados           enable row level security;
alter table public.publicaciones_comunidad enable row level security;
alter table public.comentarios            enable row level security;
alter table public.reacciones             enable row level security;

-- ============================================================================
-- PERFILES
-- ============================================================================
create policy perfiles_select on public.perfiles for select
  using (id = auth.uid() or public.es_staff());

-- El alta la hace el trigger (security definer); el usuario puede editar lo suyo.
create policy perfiles_update_propio on public.perfiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy perfiles_admin_all on public.perfiles for all
  using (public.es_admin()) with check (public.es_admin());

-- ============================================================================
-- CURSOS  (alumno ve el catálogo publicado; staff ve todo)
-- ============================================================================
create policy cursos_select on public.cursos for select
  using (public.es_staff() or estado = 'publicado');

create policy cursos_staff_insert on public.cursos for insert
  with check (public.es_staff());

create policy cursos_staff_update on public.cursos for update
  using (public.es_staff()) with check (public.es_staff());

-- Solo admin elimina cursos completos.
create policy cursos_admin_delete on public.cursos for delete
  using (public.es_admin());

-- ============================================================================
-- ETAPAS / MODULOS / LECCIONES / RECURSOS
-- Lectura del alumno gateada por inscripción activa en el curso.
-- Escritura (incl. delete de contenido) por staff.
-- ============================================================================

-- ETAPAS
create policy etapas_select on public.etapas for select
  using (public.es_staff() or public.tiene_inscripcion_activa(curso_id));
create policy etapas_staff_write on public.etapas for all
  using (public.es_staff()) with check (public.es_staff());

-- MODULOS (curso vía etapa)
create policy modulos_select on public.modulos for select
  using (
    public.es_staff() or exists (
      select 1 from public.etapas e
      where e.id = modulos.etapa_id
        and public.tiene_inscripcion_activa(e.curso_id)
    )
  );
create policy modulos_staff_write on public.modulos for all
  using (public.es_staff()) with check (public.es_staff());

-- LECCIONES (solo publicadas para el alumno)
create policy lecciones_select on public.lecciones for select
  using (
    public.es_staff() or (
      publicada and exists (
        select 1 from public.etapas e
        where e.id = lecciones.etapa_id
          and public.tiene_inscripcion_activa(e.curso_id)
      )
    )
  );
create policy lecciones_staff_write on public.lecciones for all
  using (public.es_staff()) with check (public.es_staff());

-- RECURSOS (curso vía lección → etapa)
create policy recursos_select on public.recursos for select
  using (
    public.es_staff() or exists (
      select 1
      from public.lecciones l
      join public.etapas e on e.id = l.etapa_id
      where l.id = recursos.leccion_id
        and l.publicada
        and public.tiene_inscripcion_activa(e.curso_id)
    )
  );
create policy recursos_staff_write on public.recursos for all
  using (public.es_staff()) with check (public.es_staff());

-- ============================================================================
-- QUIZZES / PREGUNTAS / OPCIONES
-- El alumno puede leer quiz y preguntas, pero NUNCA es_correcta
-- (lectura de opciones de alumno se hace por la vista pública de más abajo).
-- ============================================================================

-- QUIZZES
create policy quizzes_select on public.quizzes for select
  using (
    public.es_staff() or exists (
      select 1
      from public.lecciones l
      join public.etapas e on e.id = l.etapa_id
      where l.id = quizzes.leccion_id
        and l.publicada
        and public.tiene_inscripcion_activa(e.curso_id)
    )
  );
create policy quizzes_staff_write on public.quizzes for all
  using (public.es_staff()) with check (public.es_staff());

-- PREGUNTAS
create policy preguntas_select on public.preguntas_quiz for select
  using (
    public.es_staff() or exists (
      select 1
      from public.quizzes q
      join public.lecciones l on l.id = q.leccion_id
      join public.etapas e on e.id = l.etapa_id
      where q.id = preguntas_quiz.quiz_id
        and l.publicada
        and public.tiene_inscripcion_activa(e.curso_id)
    )
  );
create policy preguntas_staff_write on public.preguntas_quiz for all
  using (public.es_staff()) with check (public.es_staff());

-- OPCIONES: solo staff lee la tabla directa (incluye es_correcta).
-- El alumno consume las opciones por `opciones_pregunta_publicas`.
create policy opciones_staff_all on public.opciones_pregunta for all
  using (public.es_staff()) with check (public.es_staff());

-- Vista pública de opciones SIN es_correcta, autofiltrada por inscripción.
-- Definer (no security_invoker): no expone la columna correcta jamás.
create or replace view public.opciones_pregunta_publicas as
  select o.id, o.pregunta_id, o.texto, o.orden
  from public.opciones_pregunta o
  join public.preguntas_quiz pr on pr.id = o.pregunta_id
  join public.quizzes q on q.id = pr.quiz_id
  join public.lecciones l on l.id = q.leccion_id
  join public.etapas e on e.id = l.etapa_id
  where public.es_staff() or (
    l.publicada and public.tiene_inscripcion_activa(e.curso_id)
  );
grant select on public.opciones_pregunta_publicas to authenticated;

-- ============================================================================
-- INSCRIPCIONES (alumno ve las suyas; staff gestiona)
-- ============================================================================
create policy inscripciones_select on public.inscripciones for select
  using (alumno_id = auth.uid() or public.es_staff());
create policy inscripciones_staff_write on public.inscripciones for all
  using (public.es_staff()) with check (public.es_staff());

-- ============================================================================
-- CODIGOS_INVITACION (solo staff). El canje al registrarse se hace por RPC
-- SECURITY DEFINER, no por acceso directo del alumno.
-- ============================================================================
create policy codigos_staff_all on public.codigos_invitacion for all
  using (public.es_staff()) with check (public.es_staff());

-- ============================================================================
-- PROGRESO_LECCIONES (alumno escribe lo suyo; staff lee todo)
-- ============================================================================
create policy progreso_alumno on public.progreso_lecciones for all
  using (alumno_id = auth.uid()) with check (alumno_id = auth.uid());
create policy progreso_staff_select on public.progreso_lecciones for select
  using (public.es_staff());

-- ============================================================================
-- INTENTOS_QUIZ (alumno crea/lee lo suyo; staff lee todo)
-- ============================================================================
create policy intentos_alumno on public.intentos_quiz for all
  using (alumno_id = auth.uid()) with check (alumno_id = auth.uid());
create policy intentos_staff_select on public.intentos_quiz for select
  using (public.es_staff());

-- ============================================================================
-- CERTIFICADOS (alumno lee los suyos; emisión por servidor/staff)
-- ============================================================================
create policy certificados_select on public.certificados for select
  using (alumno_id = auth.uid() or public.es_staff());
create policy certificados_staff_write on public.certificados for all
  using (public.es_staff()) with check (public.es_staff());

-- ============================================================================
-- PUBLICACIONES_COMUNIDAD
-- Lectura: cualquier usuario autenticado. Escritura: autor propio.
-- Moderación (editar/eliminar ajenas) y fijar: staff.
-- ============================================================================
create policy publicaciones_select on public.publicaciones_comunidad for select
  using (auth.uid() is not null);
create policy publicaciones_insert on public.publicaciones_comunidad for insert
  with check (autor_id = auth.uid());
create policy publicaciones_update on public.publicaciones_comunidad for update
  using (autor_id = auth.uid() or public.es_staff())
  with check (autor_id = auth.uid() or public.es_staff());
create policy publicaciones_delete on public.publicaciones_comunidad for delete
  using (autor_id = auth.uid() or public.es_staff());

-- ============================================================================
-- COMENTARIOS (comunidad y preguntas de lección)
-- ============================================================================
create policy comentarios_select on public.comentarios for select
  using (auth.uid() is not null);
create policy comentarios_insert on public.comentarios for insert
  with check (autor_id = auth.uid());
create policy comentarios_update on public.comentarios for update
  using (autor_id = auth.uid() or public.es_staff())
  with check (autor_id = auth.uid() or public.es_staff());
create policy comentarios_delete on public.comentarios for delete
  using (autor_id = auth.uid() or public.es_staff());

-- ============================================================================
-- REACCIONES (cada uno gestiona las propias)
-- ============================================================================
create policy reacciones_select on public.reacciones for select
  using (auth.uid() is not null);
create policy reacciones_propias on public.reacciones for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ============================================================================
-- RPC de canje de código de invitación (usado por el server action de registro).
-- SECURITY DEFINER: valida el código, ajusta rol e inscribe si corresponde.
-- ============================================================================
create or replace function public.canjear_codigo_invitacion(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cod public.codigos_invitacion;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  select * into v_cod
  from public.codigos_invitacion
  where codigo = p_codigo and activo
  for update;

  if not found then
    raise exception 'Código inválido o inactivo';
  end if;
  if v_cod.expira_en is not null and v_cod.expira_en < now() then
    raise exception 'El código expiró';
  end if;
  if v_cod.usos_maximos is not null and v_cod.usos_actuales >= v_cod.usos_maximos then
    raise exception 'El código alcanzó su máximo de usos';
  end if;

  -- Ajustar rol según el código (no degrada a un admin existente).
  update public.perfiles
  set rol = case
              when rol = 'admin' then 'admin'
              else v_cod.rol_destino
            end
  where id = v_uid;

  -- Inscribir automáticamente si el código apunta a un curso.
  if v_cod.curso_id is not null and v_cod.rol_destino = 'alumno' then
    insert into public.inscripciones (alumno_id, curso_id, inscripto_por)
    values (v_uid, v_cod.curso_id, v_cod.creado_por)
    on conflict (alumno_id, curso_id) do update set estado = 'activa';
  end if;

  update public.codigos_invitacion
  set usos_actuales = usos_actuales + 1
  where id = v_cod.id;

  return jsonb_build_object(
    'rol', v_cod.rol_destino,
    'curso_id', v_cod.curso_id
  );
end;
$$;

grant execute on function public.canjear_codigo_invitacion(text) to authenticated;
