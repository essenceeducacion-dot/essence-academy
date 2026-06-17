import Link from "next/link";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import {
  crearLeccion,
  eliminarLeccion,
  moverLeccion,
  alternarPublicacionLeccion,
} from "../acciones";
import { FormularioLeccion } from "./FormularioLeccion";

export async function SeccionLecciones({
  cursoId,
  etapaId,
}: {
  cursoId: string;
  etapaId: string;
}) {
  const supabase = createClienteServidor();

  const [{ data: lecciones }, { data: modulos }] = await Promise.all([
    supabase
      .from("lecciones")
      .select("id, titulo, descripcion, modulo_id, publicada, orden")
      .eq("etapa_id", etapaId)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("modulos")
      .select("id, titulo")
      .eq("etapa_id", etapaId)
      .order("orden", { ascending: true }),
  ]);

  const lista = lecciones ?? [];
  const listaModulos = modulos ?? [];
  const base = `/panel/cursos/${cursoId}/etapas/${etapaId}`;

  return (
    <Card>
      <h2 className="text-base text-crema">Lecciones</h2>
      <p className="mt-1 text-sm text-crema/50">
        El contenido que ve el alumno, en orden dentro de la etapa.
      </p>

      {lista.length > 0 && (
        <ul className="mt-4 space-y-2">
          {lista.map((leccion, i) => (
            <li
              key={leccion.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-marino-700/50 px-3 py-2.5"
            >
              <Link
                href={`${base}/lecciones/${leccion.id}`}
                className="flex min-w-0 flex-1 items-center gap-2 truncate text-sm text-crema hover:text-dorado"
              >
                <span className="text-crema/40">{i + 1}.</span>
                <span className="truncate">{leccion.titulo}</span>
                {!leccion.publicada && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-crema/60">
                    Borrador
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-1">
                <form action={alternarPublicacionLeccion}>
                  <input type="hidden" name="id" value={leccion.id} />
                  <input type="hidden" name="etapa_id" value={etapaId} />
                  <input type="hidden" name="curso_id" value={cursoId} />
                  <input
                    type="hidden"
                    name="publicada"
                    value={(!leccion.publicada).toString()}
                  />
                  <button
                    type="submit"
                    className="rounded px-2 py-1 text-xs text-crema/60 hover:bg-white/5 hover:text-crema"
                  >
                    {leccion.publicada ? "Despublicar" : "Publicar"}
                  </button>
                </form>
                <form action={moverLeccion}>
                  <input type="hidden" name="id" value={leccion.id} />
                  <input type="hidden" name="etapa_id" value={etapaId} />
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
                <form action={moverLeccion}>
                  <input type="hidden" name="id" value={leccion.id} />
                  <input type="hidden" name="etapa_id" value={etapaId} />
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
                <form action={eliminarLeccion}>
                  <input type="hidden" name="id" value={leccion.id} />
                  <input type="hidden" name="etapa_id" value={etapaId} />
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
        <p className="mb-3 text-sm text-crema/70">Agregar lección</p>
        <FormularioLeccion
          accion={crearLeccion}
          cursoId={cursoId}
          etapaId={etapaId}
          modulos={listaModulos}
          textoEnvio="Agregar lección"
        />
      </div>
    </Card>
  );
}
