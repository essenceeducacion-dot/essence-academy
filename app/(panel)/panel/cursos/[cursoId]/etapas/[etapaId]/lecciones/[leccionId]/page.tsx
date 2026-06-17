import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { actualizarLeccion, eliminarLeccion } from "../../acciones";
import { FormularioLeccion } from "../../_componentes/FormularioLeccion";
import { SeccionRecursos } from "./_componentes/SeccionRecursos";
import { SeccionQuiz } from "./_componentes/SeccionQuiz";

export default async function LeccionEdicion({
  params,
}: {
  params: { cursoId: string; etapaId: string; leccionId: string };
}) {
  await requerirStaff();

  const supabase = createClienteServidor();

  const [{ data: leccion }, { data: modulos }] = await Promise.all([
    supabase
      .from("lecciones")
      .select("id, titulo, descripcion, modulo_id, publicada, orden, etapa_id")
      .eq("id", params.leccionId)
      .single(),
    supabase
      .from("modulos")
      .select("id, titulo")
      .eq("etapa_id", params.etapaId)
      .order("orden", { ascending: true }),
  ]);

  if (!leccion || leccion.etapa_id !== params.etapaId) notFound();

  const base = `/panel/cursos/${params.cursoId}/etapas/${params.etapaId}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={base} className="text-sm text-crema/50 hover:text-crema">
          ← Volver a la etapa
        </Link>
        <h1 className="mt-2 text-2xl text-crema">{leccion.titulo}</h1>
      </div>

      <Card>
        <FormularioLeccion
          accion={actualizarLeccion}
          cursoId={params.cursoId}
          etapaId={params.etapaId}
          modulos={modulos ?? []}
          leccion={leccion}
          mostrarOrden
          textoEnvio="Guardar cambios"
        />
      </Card>

      <SeccionRecursos
        cursoId={params.cursoId}
        etapaId={params.etapaId}
        leccionId={leccion.id}
      />

      <SeccionQuiz
        cursoId={params.cursoId}
        etapaId={params.etapaId}
        leccionId={leccion.id}
      />

      <Card className="border-red-400/20">
        <h2 className="text-base text-crema">Eliminar lección</h2>
        <p className="mt-1 text-sm text-crema/50">
          Borra la lección y todos sus recursos. No se puede deshacer.
        </p>
        <form action={eliminarLeccion} className="mt-4">
          <input type="hidden" name="id" value={leccion.id} />
          <input type="hidden" name="etapa_id" value={params.etapaId} />
          <input type="hidden" name="curso_id" value={params.cursoId} />
          <button
            type="submit"
            className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10"
          >
            Eliminar lección
          </button>
        </form>
      </Card>
    </div>
  );
}
