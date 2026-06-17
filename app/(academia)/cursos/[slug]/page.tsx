import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirSesion, esStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function CursoAlumno({
  params,
}: {
  params: { slug: string };
}) {
  const perfil = await requerirSesion();
  const supabase = createClienteServidor();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, titulo, descripcion, slug")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!curso) notFound();

  // Acceso: staff siempre; alumno solo con inscripción activa.
  const staff = esStaff(perfil.rol);
  if (!staff) {
    const { data: inscripcion } = await supabase
      .from("inscripciones")
      .select("id")
      .eq("alumno_id", perfil.id)
      .eq("curso_id", curso.id)
      .eq("estado", "activa")
      .maybeSingle();
    if (!inscripcion) {
      return (
        <div className="mx-auto max-w-2xl">
          <Card>
            <h1 className="text-xl text-crema">{curso.titulo}</h1>
            <p className="mt-2 text-sm text-crema/60">
              No tenés acceso a este curso. Si creés que es un error, escribile a
              la academia.
            </p>
          </Card>
        </div>
      );
    }
  }

  const { data: etapas } = await supabase
    .from("etapas")
    .select("id, nombre, descripcion, orden")
    .eq("curso_id", curso.id)
    .order("orden", { ascending: true });

  const listaEtapas = etapas ?? [];
  const etapaIds = listaEtapas.map((e) => e.id);

  const [{ data: lecciones }, { data: progreso }] = await Promise.all([
    etapaIds.length
      ? supabase
          .from("lecciones")
          .select("id, titulo, etapa_id, orden")
          .in("etapa_id", etapaIds)
          .order("orden", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; titulo: string; etapa_id: string; orden: number }[] }),
    supabase
      .from("progreso_lecciones")
      .select("leccion_id, completada")
      .eq("alumno_id", perfil.id),
  ]);

  const listaLecciones = lecciones ?? [];
  const completadas = new Set(
    (progreso ?? []).filter((p) => p.completada).map((p) => p.leccion_id)
  );

  const totalLecciones = listaLecciones.length;
  const totalCompletadas = listaLecciones.filter((l) =>
    completadas.has(l.id)
  ).length;
  const porcentaje =
    totalLecciones > 0 ? Math.round((totalCompletadas / totalLecciones) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/inicio" className="text-sm text-crema/50 hover:text-crema">
          ← Mis cursos
        </Link>
        <h1 className="mt-2 text-2xl text-crema">{curso.titulo}</h1>
        {curso.descripcion && (
          <p className="mt-1 text-sm text-crema/60">{curso.descripcion}</p>
        )}
      </div>

      {totalLecciones > 0 && (
        <Card>
          <div className="flex items-center justify-between text-sm text-crema/70">
            <span>Tu progreso</span>
            <span className="text-crema">
              {totalCompletadas} de {totalLecciones} lecciones
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-dorado transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </Card>
      )}

      {listaEtapas.length === 0 ? (
        <Card>
          <p className="text-sm text-crema/50">
            Este curso todavía no tiene contenido disponible.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {listaEtapas.map((etapa, idx) => {
            const lecc = listaLecciones.filter((l) => l.etapa_id === etapa.id);
            return (
              <Card key={etapa.id}>
                <h2 className="text-base text-crema">
                  <span className="text-crema/40">Etapa {idx + 1}. </span>
                  {etapa.nombre}
                </h2>
                {etapa.descripcion && (
                  <p className="mt-1 text-sm text-crema/50">{etapa.descripcion}</p>
                )}

                {lecc.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {lecc.map((leccion) => {
                      const hecha = completadas.has(leccion.id);
                      return (
                        <li key={leccion.id}>
                          <Link
                            href={`/cursos/${curso.slug}/lecciones/${leccion.id}`}
                            className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-marino-700/50 px-3 py-2.5 text-sm text-crema transition-colors hover:border-dorado/40"
                          >
                            <span
                              className={
                                hecha
                                  ? "flex h-5 w-5 items-center justify-center rounded-full bg-dorado text-xs text-marino-900"
                                  : "h-5 w-5 rounded-full border border-white/20"
                              }
                              aria-hidden
                            >
                              {hecha ? "✓" : ""}
                            </span>
                            <span className="truncate">{leccion.titulo}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-crema/40">
                    Sin lecciones disponibles por ahora.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
