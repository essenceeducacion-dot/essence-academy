import { requerirAdmin } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { FormularioCodigo } from "./_componentes/FormularioCodigo";
import { BotonCopiar } from "./_componentes/BotonCopiar";
import { toggleCodigo, eliminarCodigo } from "./acciones";

function fechaCorta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CodigosPage() {
  await requerirAdmin();
  const supabase = createClienteServidor();

  const [{ data: codigos }, { data: cursos }] = await Promise.all([
    supabase
      .from("codigos_invitacion")
      .select("id, codigo, rol_destino, curso_id, usos_maximos, usos_actuales, expira_en, activo, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("cursos")
      .select("id, titulo")
      .order("orden", { ascending: true }),
  ]);

  const listaCodigos = codigos ?? [];
  const listaCursos = cursos ?? [];
  const tituloPorCurso = new Map(listaCursos.map((c) => [c.id, c.titulo]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-crema">Códigos de invitación</h1>
        <p className="mt-1 text-sm text-crema/50">
          Creá códigos para que los alumnos y educadores se registren con acceso directo.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-base text-crema">Nuevo código</h2>
        <FormularioCodigo cursos={listaCursos} />
      </Card>

      {listaCodigos.length === 0 ? (
        <Card>
          <p className="text-sm text-crema/50">Todavía no hay códigos creados.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-crema/40">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Curso</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Expira</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listaCodigos.map((cod) => {
                const agotado =
                  cod.usos_maximos !== null &&
                  cod.usos_actuales >= cod.usos_maximos;
                const vencido =
                  cod.expira_en !== null &&
                  new Date(cod.expira_en) < new Date();
                const inactivo = !cod.activo || agotado || vencido;

                return (
                  <tr
                    key={cod.id}
                    className={inactivo ? "opacity-50" : ""}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-crema">{cod.codigo}</span>
                        <BotonCopiar texto={cod.codigo} />
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-crema/70">
                      {cod.rol_destino}
                    </td>
                    <td className="px-4 py-3 text-crema/70">
                      {cod.curso_id
                        ? (tituloPorCurso.get(cod.curso_id) ?? "—")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-crema/70">
                      {cod.usos_actuales}
                      {cod.usos_maximos !== null ? ` / ${cod.usos_maximos}` : ""}
                    </td>
                    <td className="px-4 py-3 text-crema/70">
                      {fechaCorta(cod.expira_en)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          inactivo
                            ? "rounded-full bg-white/10 px-2 py-0.5 text-xs text-crema/40"
                            : "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300"
                        }
                      >
                        {inactivo ? "Inactivo" : "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <form action={toggleCodigo}>
                          <input type="hidden" name="id" value={cod.id} />
                          <input
                            type="hidden"
                            name="activo"
                            value={String(cod.activo)}
                          />
                          <button
                            type="submit"
                            className="rounded px-2 py-1 text-xs text-crema/50 hover:bg-white/5 hover:text-crema"
                          >
                            {cod.activo ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                        <form action={eliminarCodigo}>
                          <input type="hidden" name="id" value={cod.id} />
                          <button
                            type="submit"
                            aria-label="Eliminar código"
                            className="rounded px-2 py-1 text-xs text-red-300/60 hover:bg-red-500/10 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
