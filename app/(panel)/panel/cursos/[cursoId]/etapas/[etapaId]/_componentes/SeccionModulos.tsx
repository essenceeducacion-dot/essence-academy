import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { crearModulo, eliminarModulo } from "../acciones";
import { FormularioModulo } from "./FormularioModulo";

export async function SeccionModulos({
  cursoId,
  etapaId,
}: {
  cursoId: string;
  etapaId: string;
}) {
  const supabase = createClienteServidor();
  const { data: modulos } = await supabase
    .from("modulos")
    .select("id, titulo")
    .eq("etapa_id", etapaId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  const lista = modulos ?? [];

  return (
    <Card>
      <h2 className="text-base text-crema">Módulos</h2>
      <p className="mt-1 text-sm text-crema/50">
        Agrupadores opcionales para ordenar las lecciones de la etapa.
      </p>

      {lista.length > 0 && (
        <ul className="mt-4 space-y-2">
          {lista.map((modulo) => (
            <li
              key={modulo.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-marino-700/50 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-crema">
                {modulo.titulo}
              </span>
              <form action={eliminarModulo}>
                <input type="hidden" name="id" value={modulo.id} />
                <input type="hidden" name="etapa_id" value={etapaId} />
                <input type="hidden" name="curso_id" value={cursoId} />
                <button
                  type="submit"
                  aria-label="Eliminar módulo"
                  className="rounded px-2 py-1 text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-white/10 pt-5">
        <FormularioModulo accion={crearModulo} cursoId={cursoId} etapaId={etapaId} />
      </div>
    </Card>
  );
}
