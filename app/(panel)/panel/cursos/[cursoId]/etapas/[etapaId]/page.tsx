import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { actualizarEtapa, eliminarEtapa } from "../acciones";
import { FormularioEtapa } from "../_componentes/FormularioEtapa";
import { SeccionModulos } from "./_componentes/SeccionModulos";
import { SeccionLecciones } from "./_componentes/SeccionLecciones";

export default async function EtapaEdicion({
  params,
}: {
  params: { cursoId: string; etapaId: string };
}) {
  await requerirStaff();

  const supabase = createClienteServidor();
  const { data: etapa } = await supabase
    .from("etapas")
    .select("id, nombre, descripcion, orden, curso_id")
    .eq("id", params.etapaId)
    .single();

  if (!etapa || etapa.curso_id !== params.cursoId) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/panel/cursos/${params.cursoId}`}
          className="text-sm text-crema/50 hover:text-crema"
        >
          ← Volver al curso
        </Link>
        <h1 className="mt-2 text-2xl text-crema">{etapa.nombre}</h1>
      </div>

      <Card>
        <FormularioEtapa
          accion={actualizarEtapa}
          cursoId={params.cursoId}
          etapa={etapa}
          mostrarOrden
          textoEnvio="Guardar cambios"
        />
      </Card>

      <SeccionModulos cursoId={params.cursoId} etapaId={etapa.id} />

      <SeccionLecciones cursoId={params.cursoId} etapaId={etapa.id} />

      <Card className="border-red-400/20">
        <h2 className="text-base text-crema">Eliminar etapa</h2>
        <p className="mt-1 text-sm text-crema/50">
          Borra la etapa y todo su contenido. No se puede deshacer.
        </p>
        <form action={eliminarEtapa} className="mt-4">
          <input type="hidden" name="id" value={etapa.id} />
          <input type="hidden" name="curso_id" value={params.cursoId} />
          <button
            type="submit"
            className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10"
          >
            Eliminar etapa
          </button>
        </form>
      </Card>
    </div>
  );
}
