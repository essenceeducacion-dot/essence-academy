import Link from "next/link";
import { requerirSesion } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { flags } from "@/lib/env";
import { Card } from "@/components/ui/Card";

type CursoInscripto = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  es_insignia: boolean;
};

export default async function InicioAlumno() {
  const perfil = await requerirSesion();
  const supabase = createClienteServidor();

  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("curso:cursos(id, slug, titulo, descripcion, es_insignia)")
    .eq("alumno_id", perfil.id)
    .eq("estado", "activa")
    .order("fecha_inscripcion", { ascending: true });

  const cursos = (inscripciones ?? [])
    .map((i) => i.curso as unknown as CursoInscripto | null)
    .filter((c): c is CursoInscripto => c !== null);

  // Progreso por curso: lecciones publicadas vs completadas.
  const progresoPorCurso = new Map<string, { total: number; hechas: number }>();
  if (cursos.length > 0) {
    const cursoIds = cursos.map((c) => c.id);

    const { data: etapas } = await supabase
      .from("etapas")
      .select("id, curso_id")
      .in("curso_id", cursoIds);

    const etapaIds = (etapas ?? []).map((e) => e.id);
    const etapaCurso = new Map((etapas ?? []).map((e) => [e.id, e.curso_id]));

    const [{ data: lecciones }, { data: progreso }] = await Promise.all([
      etapaIds.length
        ? supabase
            .from("lecciones")
            .select("id, etapa_id")
            .in("etapa_id", etapaIds)
            .eq("publicada", true)
        : Promise.resolve({ data: [] as { id: string; etapa_id: string }[] }),
      supabase
        .from("progreso_lecciones")
        .select("leccion_id")
        .eq("alumno_id", perfil.id)
        .eq("completada", true),
    ]);

    const completadas = new Set((progreso ?? []).map((p) => p.leccion_id));

    for (const lec of lecciones ?? []) {
      const cursoId = etapaCurso.get(lec.etapa_id);
      if (!cursoId) continue;
      const cur = progresoPorCurso.get(cursoId) ?? { total: 0, hechas: 0 };
      cur.total += 1;
      if (completadas.has(lec.id)) cur.hechas += 1;
      progresoPorCurso.set(cursoId, cur);
    }

    // Certificados emitidos.
    const { data: certs } = await supabase
      .from("certificados")
      .select("curso_id")
      .eq("alumno_id", perfil.id)
      .in("curso_id", cursoIds);

    for (const cert of certs ?? []) {
      const cur = progresoPorCurso.get(cert.curso_id);
      if (cur) (cur as typeof cur & { cert: boolean }).cert = true;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-crema">Hola, {perfil.nombre ?? "barbero"}</h1>
        <p className="mt-1 text-sm text-crema/50">
          Estos son tus cursos. Acá vas a estudiar y seguir tu progreso.
        </p>
      </div>

      {cursos.length === 0 ? (
        <Card>
          <h2 className="text-base text-crema">Todavía no tenés cursos activos</h2>
          <p className="mt-1 text-sm text-crema/50">
            Cuando la academia te habilite un curso, va a aparecer acá.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cursos.map((curso) => {
            const prog = progresoPorCurso.get(curso.id) ?? { total: 0, hechas: 0 };
            const pct =
              prog.total > 0 ? Math.round((prog.hechas / prog.total) * 100) : 0;
            const completo = prog.total > 0 && prog.hechas >= prog.total;
            const tieneCert = (prog as typeof prog & { cert?: boolean }).cert ?? false;

            return (
              <Card key={curso.id} className="flex flex-col gap-3">
                <Link href={`/cursos/${curso.slug}`} className="group flex-1">
                  {curso.es_insignia && (
                    <span className="mb-2 inline-block rounded-full bg-dorado/15 px-2 py-0.5 text-xs text-dorado">
                      Programa insignia
                    </span>
                  )}
                  <h2 className="text-base text-crema group-hover:text-dorado">
                    {curso.titulo}
                  </h2>
                  {curso.descripcion && (
                    <p className="mt-1 line-clamp-2 text-sm text-crema/50">
                      {curso.descripcion}
                    </p>
                  )}
                </Link>

                {prog.total > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-crema/50">
                      <span>Progreso</span>
                      <span>{prog.hechas}/{prog.total} lecciones</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-dorado transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Link
                    href={`/cursos/${curso.slug}`}
                    className="text-sm text-dorado/80 hover:text-dorado"
                  >
                    {completo ? "Repasar curso" : "Continuar →"}
                  </Link>
                  {flags.certificados && completo && (
                    <Link
                      href={`/cursos/${curso.slug}/certificado`}
                      className={
                        tieneCert
                          ? "text-sm text-emerald-300/80 hover:text-emerald-300"
                          : "text-sm text-crema/50 hover:text-crema"
                      }
                    >
                      {tieneCert ? "Ver certificado" : "Obtener certificado"}
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
