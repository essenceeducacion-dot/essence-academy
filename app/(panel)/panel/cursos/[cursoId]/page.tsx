import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { actualizarCurso, cambiarEstadoCurso, eliminarCurso } from "../acciones";
import { FormularioCurso } from "../_componentes/FormularioCurso";
import { SeccionEtapas } from "./etapas/_componentes/SeccionEtapas";

const accionEstado: Record<string, { estado: string; texto: string }> = {
  borrador: { estado: "publicado", texto: "Publicar" },
  publicado: { estado: "archivado", texto: "Archivar" },
  archivado: { estado: "publicado", texto: "Republicar" },
};

export default async function CursoEdicion({
  params,
}: {
  params: { cursoId: string };
}) {
  const perfil = await requerirStaff();

  const supabase = createClienteServidor();
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, titulo, slug, descripcion, es_insignia, estado, orden")
    .eq("id", params.cursoId)
    .single();

  if (!curso) notFound();

  const siguiente = accionEstado[curso.estado];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/panel/cursos" className="text-sm text-crema/50 hover:text-crema">
            ← Volver a cursos
          </Link>
          <h1 className="mt-2 text-2xl text-crema">{curso.titulo}</h1>
        </div>
        {siguiente && (
          <form action={cambiarEstadoCurso}>
            <input type="hidden" name="id" value={curso.id} />
            <input type="hidden" name="estado" value={siguiente.estado} />
            <button
              type="submit"
              className="rounded-lg border border-dorado/60 px-3 py-2 text-sm text-dorado transition-colors hover:bg-dorado/10"
            >
              {siguiente.texto}
            </button>
          </form>
        )}
      </div>

      <Card>
        <FormularioCurso
          accion={actualizarCurso}
          curso={curso}
          textoEnvio="Guardar cambios"
        />
      </Card>

      <SeccionEtapas cursoId={curso.id} />

      {perfil.rol === "admin" && (
        <Card className="border-red-400/20">
          <h2 className="text-base text-crema">Eliminar curso</h2>
          <p className="mt-1 text-sm text-crema/50">
            Borra el curso y todo su contenido. Esta acción no se puede deshacer.
          </p>
          <form action={eliminarCurso} className="mt-4">
            <input type="hidden" name="id" value={curso.id} />
            <button
              type="submit"
              className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10"
            >
              Eliminar curso
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
