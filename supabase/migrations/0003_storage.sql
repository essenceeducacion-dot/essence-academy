-- ============================================================================
-- Essence Academy — Buckets de Storage + políticas (Fase 0)
--
-- Convención de rutas (importante para las políticas de lectura por inscripción):
--   videos/<curso_id>/<leccion_id>/<archivo>
--   materiales/<curso_id>/<leccion_id>/<archivo>
--   comunidad/<autor_id>/<archivo>
--   certificados/<alumno_id>/<archivo>
--   portadas/<curso_id>/<archivo>          (público)
--   avatares/<usuario_id>/<archivo>         (público)
-- (storage.foldername(name))[1] = primera carpeta de la ruta.
-- ============================================================================

insert into storage.buckets (id, name, public) values
  ('videos',       'videos',       false),
  ('materiales',   'materiales',   false),
  ('portadas',     'portadas',     true),
  ('avatares',     'avatares',     true),
  ('comunidad',    'comunidad',    false),
  ('certificados', 'certificados', false)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- PORTADAS (público): lee cualquiera; escribe staff.
-- ----------------------------------------------------------------------------
create policy portadas_lectura on storage.objects for select
  using (bucket_id = 'portadas');
create policy portadas_escritura on storage.objects for all
  using (bucket_id = 'portadas' and public.es_staff())
  with check (bucket_id = 'portadas' and public.es_staff());

-- ----------------------------------------------------------------------------
-- AVATARES (público): lee cualquiera; cada uno escribe en su carpeta.
-- ----------------------------------------------------------------------------
create policy avatares_lectura on storage.objects for select
  using (bucket_id = 'avatares');
create policy avatares_escritura on storage.objects for all
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- VIDEOS (privado): lee staff o alumno inscripto al curso (1ra carpeta).
-- Escribe staff.
-- ----------------------------------------------------------------------------
create policy videos_lectura on storage.objects for select
  using (
    bucket_id = 'videos' and (
      public.es_staff()
      or public.tiene_inscripcion_activa(((storage.foldername(name))[1])::uuid)
    )
  );
create policy videos_escritura on storage.objects for all
  using (bucket_id = 'videos' and public.es_staff())
  with check (bucket_id = 'videos' and public.es_staff());

-- ----------------------------------------------------------------------------
-- MATERIALES (privado): mismo criterio que videos.
-- ----------------------------------------------------------------------------
create policy materiales_lectura on storage.objects for select
  using (
    bucket_id = 'materiales' and (
      public.es_staff()
      or public.tiene_inscripcion_activa(((storage.foldername(name))[1])::uuid)
    )
  );
create policy materiales_escritura on storage.objects for all
  using (bucket_id = 'materiales' and public.es_staff())
  with check (bucket_id = 'materiales' and public.es_staff());

-- ----------------------------------------------------------------------------
-- COMUNIDAD (privado): lee cualquier autenticado; cada uno escribe lo suyo;
-- staff modera (puede borrar ajenas).
-- ----------------------------------------------------------------------------
create policy comunidad_lectura on storage.objects for select
  using (bucket_id = 'comunidad' and auth.uid() is not null);
create policy comunidad_escritura_propia on storage.objects for insert
  with check (
    bucket_id = 'comunidad'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy comunidad_borrado on storage.objects for delete
  using (
    bucket_id = 'comunidad' and (
      (storage.foldername(name))[1] = auth.uid()::text or public.es_staff()
    )
  );

-- ----------------------------------------------------------------------------
-- CERTIFICADOS (privado, URL firmada): lee el dueño o staff; escribe staff.
-- ----------------------------------------------------------------------------
create policy certificados_lectura on storage.objects for select
  using (
    bucket_id = 'certificados' and (
      (storage.foldername(name))[1] = auth.uid()::text or public.es_staff()
    )
  );
create policy certificados_escritura on storage.objects for all
  using (bucket_id = 'certificados' and public.es_staff())
  with check (bucket_id = 'certificados' and public.es_staff());
