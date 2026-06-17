import Link from "next/link";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { crearEtapa, eliminarEtapa, moverEtapa } from "../acciones";
import { FormularioEtapa } from "./FormularioEtapa";

export async function SeccionEtapas({ cursoId }: { cursoId: string }) {
  const supabase = createClienteServidor();
  const { data: etapas } = await supabase
    .from("etapas")
    .select("id, nombre, descripcion, orden")
    .eq("curso_id", cursoId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  const lista = etapas ?? [];

  return (
    <Card>
      <h2 className="text-base text-crema">Etapas</h2>
      <p className="mt-1 text-sm text-crema/50">
        Las secciones del curso, en orden. Cada etapa contiene sus lecciones.
      </p>

      {lista.length > 0 && (
        <ul className="mt-4 space-y-2">
          {lista.map((etapa, i) => (
            <li
              key={etapa.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-marino-700/50 px-3 py-2.5"
            >
              <Link
                href={`/panel/cursos/${cursoId}/etapas/${etapa.id}`}
                className="min-w-0 flex-1 truncate text-sm text-crema hover:text-dorado"
              >
                <span className="text-crema/40">{i + 1}.</span> {etapa.nombre}
              </Link>

              <div className="flex items-center gap-1">
                <form action={moverEtapa}>
                  <input type="hidden" name="id" value={etapa.id} />
                  <input type="hidden" name="curso_id" value={cursoId} />
                  <input type="hidden" name="direccion" value="subir" />
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label="Subir"
                    className="rounded px-2 py-1 text-crema/60 hover:bg-white/5 hover:text-crema disabled:opacity-30"
                  >
                    ↑
                  </button>
                </form>
                <form action={moverEtapa}>
                  <input type="hidden" name="id" value={etapa.id} />
                  <input type="hidden" name="curso_id" value={cursoId} />
                  <input type="hidden" name="direccion" value="bajar" />
                  <button
                    type="submit"
                    disabled={i === lista.length - 1}
                    aria-label="Bajar"
                    className="rounded px-2 py-1 text-crema/60 hover:bg-white/5 hover:text-crema disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
                <form action={eliminarEtapa}>
                  <input type="hidden" name="id" value={etapa.id} />
                  <input type="hidden" name="curso_id" value={cursoId} />
                  <button
                    type="submit"
                    aria-label="Eliminar"
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

      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="mb-3 text-sm text-crema/70">Agregar etapa</p>
        <FormularioEtapa accion={crearEtapa} cursoId={cursoId} textoEnvio="Agregar etapa" />
      </div>
    </Card>
  );
}
