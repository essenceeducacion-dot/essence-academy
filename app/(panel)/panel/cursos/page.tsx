import Link from "next/link";
import { requerirStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const estiloEstado: Record<string, string> = {
  borrador: "bg-white/10 text-crema/70",
  publicado: "bg-emerald-500/15 text-emerald-300",
  archivado: "bg-amber-500/15 text-amber-300",
};

const etiquetaEstado: Record<string, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  archivado: "Archivado",
};

export default async function CursosLista() {
  await requerirStaff();

  const supabase = createClienteServidor();
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, titulo, slug, estado, orden, es_insignia")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-crema">Cursos</h1>
          <p className="mt-1 text-sm text-crema/50">
            Creá y organizá los cursos de la academia.
          </p>
        </div>
        <Link href="/panel/cursos/nuevo">
          <Button>Nuevo curso</Button>
        </Link>
      </div>

      {!cursos || cursos.length === 0 ? (
        <Card>
          <p className="text-sm text-crema/60">
            Todavía no hay cursos. Empezá creando el primero.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {cursos.map((curso) => (
            <Link key={curso.id} href={`/panel/cursos/${curso.id}`} className="block">
              <Card className="flex items-center justify-between p-4 transition-colors hover:border-dorado/40">
                <div className="flex items-center gap-3">
                  <span className="text-base text-crema">{curso.titulo}</span>
                  {curso.es_insignia && (
                    <span className="rounded-full bg-dorado/15 px-2 py-0.5 text-xs text-dorado">
                      Insignia
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs",
                    estiloEstado[curso.estado] ?? "bg-white/10 text-crema/70"
                  )}
                >
                  {etiquetaEstado[curso.estado] ?? curso.estado}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
