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
        <Link href="/panel/alumnos" className="block">
          <Card className="h-full transition-colors hover:border-dorado/40">
            <h2 className="text-base text-crema">Alumnos e inscripciones</h2>
            <p className="mt-1 text-sm text-crema/50">
              Inscribí alumnos a un curso y gestioná sus accesos.
            </p>
          </Card>
        </Link>
        <Link href="/panel/progreso" className="block">
          <Card className="h-full transition-colors hover:border-dorado/40">
            <h2 className="text-base text-crema">Progreso de alumnos</h2>
            <p className="mt-1 text-sm text-crema/50">
              Avance por curso y certificados emitidos.
            </p>
          </Card>
        </Link>
        {esAdmin && (
          <Link href="/panel/codigos" className="block">
            <Card className="h-full transition-colors hover:border-dorado/40">
              <h2 className="text-base text-crema">Códigos de invitación</h2>
              <p className="mt-1 text-sm text-crema/50">
                Creá y administrá códigos de acceso.
              </p>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
