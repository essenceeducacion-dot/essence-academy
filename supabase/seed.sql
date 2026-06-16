-- ============================================================================
-- Essence Academy — Seed (Fase 0)
-- Crea el curso insignia "Programa 0 a 100" con sus 3 etapas vacías.
-- Idempotente: se apoya en el slug único del curso.
-- ============================================================================

insert into public.cursos (titulo, slug, descripcion, es_insignia, estado, orden)
values (
  'Programa 0 a 100',
  'programa-0-a-100',
  'El programa insignia de Essence Academy: de cero a barbero profesional, en tres etapas — Origen, Criterio y Proyección.',
  true,
  'publicado',
  0
)
on conflict (slug) do nothing;

-- Tres etapas del programa insignia.
with curso as (
  select id from public.cursos where slug = 'programa-0-a-100'
)
insert into public.etapas (curso_id, nombre, descripcion, orden)
select curso.id, e.nombre, e.descripcion, e.orden
from curso, (values
  ('Origen',     'Fundamentos: las bases del oficio.',                    0),
  ('Criterio',   'Técnica y criterio: decisiones que definen el estilo.', 1),
  ('Proyección', 'Marca, cliente y negocio: proyectar la carrera.',       2)
) as e(nombre, descripcion, orden)
where not exists (
  select 1 from public.etapas x
  where x.curso_id = curso.id and x.nombre = e.nombre
);
