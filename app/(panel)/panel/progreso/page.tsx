import { requerirStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

export default async function ProgresoPage() {
  await requerirStaff();
  const supabase = createClienteServidor();

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, titulo, slug")
    .order("orden", { ascending: true });

  const listaCursos = cursos ?? [];
  if (listaCursos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl text-crema">Progreso de alumnos</h1>
        <Card>
          <p className="text-sm text-crema/50">No hay cursos todavía.</p>
        </Card>
      </div>
    );
  }

  const cursoIds = listaCursos.map((c) => c.id);

  const [
    { data: etapas },
    { data: lecciones },
    { data: inscripciones },
    { data: progreso },
    { data: certificados },
  ] = await Promise.all([
    supabase.from("etapas").select("id, curso_id").in("curso_id", cursoIds),
    supabase
      .from("lecciones")
      .select("id, etapa_id")
      .eq("publicada", true)
      .in(
        "etapa_id",
        (await supabase
          .from("etapas")
          .select("id")
          .in("curso_id", cursoIds)
          .then((r) => r.data ?? [])
        ).map((e) => e.id)
      ),
    supabase
      .from("inscripciones")
      .select("alumno_id, curso_id, estado")
      .in("curso_id", cursoIds)
      .eq("estado", "activa"),
    supabase
      .from("progreso_lecciones")
      .select("alumno_id, leccion_id")
      .eq("completada", true),
    supabase
      .from("certificados")
      .select("alumno_id, curso_id")
      .in("curso_id", cursoIds),
  ]);

  // Nombres de alumnos vía admin (RLS solo deja leer el propio perfil).
  const alumnoIds = Array.from(
    new Set((inscripciones ?? []).map((i) => i.alumno_id))
  );
  const nombrePorId = new Map<string, string>();
  if (alumnoIds.length) {
    const admin = createClienteAdmin();
    const { data: perfiles } = await admin
      .from("perfiles")
      .select("id, nombre, email")
      .in("id", alumnoIds);
    for (const p of perfiles ?? [])
      nombrePorId.set(p.id, p.nombre || p.email || "Alumno");
  }

  // Lecciones por curso.
  const etapaPorId = new Map((etapas ?? []).map((e) => [e.id, e.curso_id]));
  const leccionesPorCurso = new Map<string, Set<string>>();
  for (const l of lecciones ?? []) {
    const cursoId = etapaPorId.get(l.etapa_id);
    if (!cursoId) continue;
    if (!leccionesPorCurso.has(cursoId)) leccionesPorCurso.set(cursoId, new Set());
    leccionesPorCurso.get(cursoId)!.add(l.id);
  }

  // Progreso por alumno+curso.
  const leccionIds = new Set((lecciones ?? []).map((l) => l.id));
  const completadasPorAlumno = new Map<string, Set<string>>();
  for (const p of progreso ?? []) {
    if (!leccionIds.has(p.leccion_id)) continue;
    if (!completadasPorAlumno.has(p.alumno_id))
      completadasPorAlumno.set(p.alumno_id, new Set());
    completadasPorAlumno.get(p.alumno_id)!.add(p.leccion_id);
  }

  // Certificados.
  const tieneCert = new Set(
    (certificados ?? []).map((c) => `${c.alumno_id}:${c.curso_id}`)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-crema">Progreso de alumnos</h1>
        <p className="mt-1 text-sm text-crema/50">
          Avance por curso de todos los alumnos activos.
        </p>
      </div>

      {listaCursos.map((curso) => {
        const totalLecs = leccionesPorCurso.get(curso.id)?.size ?? 0;
        const inscriptos = (inscripciones ?? []).filter(
          (i) => i.curso_id === curso.id
        );

        if (inscriptos.length === 0) return null;

        return (
          <Card key={curso.id} className="p-0 overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm text-crema">{curso.titulo}</p>
              <p className="text-xs text-crema/40">
                {inscriptos.length} alumno{inscriptos.length !== 1 ? "s" : ""} · {totalLecs} lección{totalLecs !== 1 ? "es" : ""}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-crema/40">
                  <th className="px-4 py-2">Alumno</th>
                  <th className="px-4 py-2">Progreso</th>
                  <th className="px-4 py-2">Certificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inscriptos.map((insc) => {
                  const completadas =
                    completadasPorAlumno.get(insc.alumno_id) ?? new Set();
                  const lecsCurso = leccionesPorCurso.get(curso.id) ?? new Set();
                  const hechas = [...lecsCurso].filter((id) =>
                    completadas.has(id)
                  ).length;
                  const pct =
                    totalLecs > 0 ? Math.round((hechas / totalLecs) * 100) : 0;
                  const cert = tieneCert.has(`${insc.alumno_id}:${curso.id}`);

                  return (
                    <tr key={insc.alumno_id}>
                      <td className="px-4 py-3 text-crema/80">
                        {nombrePorId.get(insc.alumno_id) ?? "Alumno"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-dorado"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-crema/60">
                            {hechas}/{totalLecs}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {cert ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                            Emitido
                          </span>
                        ) : (
                          <span className="text-xs text-crema/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}
