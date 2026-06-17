import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { crearRecurso, eliminarRecurso, moverRecurso } from "../acciones";
import { FormularioRecurso } from "./FormularioRecurso";

const etiquetaTipo: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  imagen: "Imagen",
  texto: "Texto",
};

export async function SeccionRecursos({
  cursoId,
  etapaId,
  leccionId,
}: {
  cursoId: string;
  etapaId: string;
  leccionId: string;
}) {
  const supabase = createClienteServidor();
  const { data: recursos } = await supabase
    .from("recursos")
    .select("id, tipo, titulo, tipo_fuente, proveedor_embed")
    .eq("leccion_id", leccionId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  const lista = recursos ?? [];

  return (
    <Card>
      <h2 className="text-base text-crema">Recursos</h2>
      <p className="mt-1 text-sm text-crema/50">
        Videos, PDFs, imágenes y textos que componen la lección, en orden.
      </p>

      {lista.length > 0 && (
        <ul className="mt-4 space-y-2">
          {lista.map((recurso, i) => (
            <li
              key={recurso.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-marino-700/50 px-3 py-2.5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-crema/60">
                  {etiquetaTipo[recurso.tipo] ?? recurso.tipo}
                </span>
                <span className="truncate text-sm text-crema">{recurso.titulo}</span>
                {recurso.tipo === "video" && recurso.tipo_fuente === "embed" && (
                  <span className="text-xs text-crema/40">
                    {recurso.proveedor_embed}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <form action={moverRecurso}>
                  <input type="hidden" name="id" value={recurso.id} />
                  <input type="hidden" name="curso_id" value={cursoId} />
                  <input type="hidden" name="etapa_id" value={etapaId} />
                  <input type="hidden" name="leccion_id" value={leccionId} />
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
                <form action={moverRecurso}>
                  <input type="hidden" name="id" value={recurso.id} />
                  <input type="hidden" name="curso_id" value={cursoId} />
                  <input type="hidden" name="etapa_id" value={etapaId} />
                  <input type="hidden" name="leccion_id" value={leccionId} />
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
                <form action={eliminarRecurso}>
                  <input type="hidden" name="id" value={recurso.id} />
                  <input type="hidden" name="curso_id" value={cursoId} />
                  <input type="hidden" name="etapa_id" value={etapaId} />
                  <input type="hidden" name="leccion_id" value={leccionId} />
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
        <p className="mb-3 text-sm text-crema/70">Agregar recurso</p>
        <FormularioRecurso
          accion={crearRecurso}
          cursoId={cursoId}
          etapaId={etapaId}
          leccionId={leccionId}
        />
      </div>
    </Card>
  );
}
