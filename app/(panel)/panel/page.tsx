import Link from "next/link";
import { requerirStaff } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";

export default async function PanelInicio() {
  const perfil = await requerirStaff();
  const esAdmin = perfil.rol === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-crema">Hola, {perfil.nombre ?? "equipo"}</h1>
        <p className="mt-1 text-sm text-crema/50">
          Este es el panel de Essence Academy. Desde acá vas a gestionar los
          cursos y los alumnos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/panel/cursos" className="block">
          <Card className="h-full transition-colors hover:border-dorado/40">
            <h2 className="text-base text-crema">Cursos</h2>
            <p className="mt-1 text-sm text-crema/50">
              Carga y organización de contenido.
            </p>
          </Card>
        </Link>
        <Card>
          <h2 className="text-base text-crema">Alumnos e invitaciones</h2>
          <p className="mt-1 text-sm text-crema/50">
            Códigos de acceso e inscripciones. (Próxima etapa)
          </p>
        </Card>
        {esAdmin && (
          <Card>
            <h2 className="text-base text-crema">Educadores</h2>
            <p className="mt-1 text-sm text-crema/50">
              Gestión del equipo. (Próxima etapa)
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
