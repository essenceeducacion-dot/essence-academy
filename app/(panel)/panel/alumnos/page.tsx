import Link from "next/link";
import { requerirStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { FormularioInscripcion } from "./_componentes/FormularioInscripcion";
import {
  crearInscripcion,
  cambiarEstadoInscripcion,
  eliminarInscripcion,
} from "./acciones";

const etiquetaEstado: Record<string, string> = {
  activa: "Activa",
  pausada: "Pausada",
  revocada: "Revocada",
};

export default async function PanelAlumnos() {
  await requerirStaff();
  const supabase = createClienteServidor();

  const [{ data: alumnos }, { data: cursos }, { data: inscripciones }] =
    await Promise.all([
      supabase
        .from("perfiles")
        .select("id, nombre, email")
        .eq("rol", "alumno")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
      supabase
        .from("cursos")
        .select("id, titulo")
        .order("titulo", { ascending: true }),
      supabase
        .from("inscripciones")
        .select("id, alumno_id, curso_id, estado, fecha_inscripcion")
        .order("fecha_inscripcion", { ascending: false }),
    ]);

  const listaAlumnos = alumnos ?? [];
  const listaCursos = cursos ?? [];
  const listaInscripciones = inscripciones ?? [];

  const nombreAlumno = new Map(
    listaAlumnos.map((a) => [a.id, a.nombre || a.email || "Alumno sin nombre"])
  );
  const tituloCurso = new Map(listaCursos.map((c) => [c.id, c.titulo]));

  const opcionesAlumnos = listaAlumnos.map((a) => ({
    id: a.id,
    etiqueta: a.nombre ? `${a.nombre} (${a.email ?? "sin email"})` : a.email ?? a.id,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/panel" className="text-sm text-crema/50 hover:text-crema">
          ← Panel
        </Link>
        <h1 className="mt-2 text-2xl text-crema">Alumnos e inscripciones</h1>
        <p className="mt-1 text-sm text-crema/50">
          Inscribí alumnos a un curso y gestioná el estado de sus accesos.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 text-base text-crema">Inscribir alumno</h2>
        {listaAlumnos.length === 0 ? (
          <p className="text-sm text-crema/50">
            Todavía no hay alumnos registrados. Cuando se registren con un código
            de invitación van a aparecer acá.
          </p>
        ) : listaCursos.length === 0 ? (
          <p className="text-sm text-crema/50">
            Primero creá un curso para poder inscribir alumnos.
          </p>
        ) : (
          <FormularioInscripcion
            accion={crearInscripcion}
            alumnos={opcionesAlumnos}
            cursos={listaCursos}
          />
        )}
      </Card>

      <Card>
        <h2 className="text-base text-crema">Inscripciones</h2>
        {listaInscripciones.length === 0 ? (
          <p className="mt-1 text-sm text-crema/50">Todavía no hay inscripciones.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {listaInscripciones.map((ins) => (
              <li
                key={ins.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-marino-700/50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-crema">
                    {nombreAlumno.get(ins.alumno_id) ?? "Alumno"}
                  </p>
                  <p className="truncate text-xs text-crema/50">
                    {tituloCurso.get(ins.curso_id) ?? "Curso"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <form action={cambiarEstadoInscripcion} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={ins.id} />
                    <select
                      name="estado"
                      defaultValue={ins.estado}
                      className="rounded-lg border border-white/10 bg-marino-700 px-2.5 py-1.5 text-xs text-crema focus:border-dorado/60"
                    >
                      {Object.entries(etiquetaEstado).map(([valor, etq]) => (
                        <option key={valor} value={valor} className="bg-marino-700">
                          {etq}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded px-2 py-1 text-xs text-crema/60 hover:bg-white/5 hover:text-crema"
                    >
                      Guardar
                    </button>
                  </form>
                  <form action={eliminarInscripcion}>
                    <input type="hidden" name="id" value={ins.id} />
                    <button
                      type="submit"
                      aria-label="Eliminar inscripción"
                      className="rounded px-2 py-1 text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
