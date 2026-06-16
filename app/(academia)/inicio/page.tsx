import { requerirSesion } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";

export default async function InicioAlumno() {
  const perfil = await requerirSesion();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-crema">
          Hola, {perfil.nombre ?? "barbero"}
        </h1>
        <p className="mt-1 text-sm text-crema/50">
          Estos son tus cursos. Acá vas a estudiar y seguir tu progreso.
        </p>
      </div>

      <Card>
        <h2 className="text-base text-crema">Todavía no tenés cursos activos</h2>
        <p className="mt-1 text-sm text-crema/50">
          Cuando la academia te habilite un curso, va a aparecer acá. (El
          catálogo llega en la próxima etapa.)
        </p>
      </Card>
    </div>
  );
}
