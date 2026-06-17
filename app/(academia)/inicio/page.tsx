import Link from "next/link";
import { requerirSesion } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

type CursoInscripto = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  es_insignia: boolean;
};

export default async function InicioAlumno() {
  const perfil = await requerirSesion();
  const supabase = createClienteServidor();

  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("curso:cursos(id, slug, titulo, descripcion, es_insignia)")
    .eq("alumno_id", perfil.id)
    .eq("estado", "activa")
    .order("fecha_inscripcion", { ascending: true });

  const cursos = (inscripciones ?? [])
    .map((i) => i.curso as unknown as CursoInscripto | null)
    .filter((c): c is CursoInscripto => c !== null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-crema">Hola, {perfil.nombre ?? "barbero"}</h1>
        <p className="mt-1 text-sm text-crema/50">
          Estos son tus cursos. Acá vas a estudiar y seguir tu progreso.
        </p>
      </div>

      {cursos.length === 0 ? (
        <Card>
          <h2 className="text-base text-crema">Todavía no tenés cursos activos</h2>
          <p className="mt-1 text-sm text-crema/50">
            Cuando la academia te habilite un curso, va a aparecer acá.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cursos.map((curso) => (
            <Link key={curso.id} href={`/cursos/${curso.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-dorado/40">
                {curso.es_insignia && (
                  <span className="mb-2 inline-block rounded-full bg-dorado/15 px-2 py-0.5 text-xs text-dorado">
                    Programa insignia
                  </span>
                )}
                <h2 className="text-base text-crema group-hover:text-dorado">
                  {curso.titulo}
                </h2>
                {curso.descripcion && (
                  <p className="mt-1 line-clamp-3 text-sm text-crema/50">
                    {curso.descripcion}
                  </p>
                )}
                <span className="mt-3 inline-block text-sm text-dorado/80">
                  Entrar al curso →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
