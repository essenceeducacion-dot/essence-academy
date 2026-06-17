import Link from "next/link";
import { requerirStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function PanelInicio() {
  const perfil = await requerirStaff();
  const esAdmin = perfil.rol === "admin";
  const supabase = createClienteServidor();

  const [
    { count: totalAlumnos },
    { count: totalCursos },
    { count: totalInscripciones },
    { count: totalCertificados },
  ] = await Promise.all([
    supabase.from("perfiles").select("*", { count: "exact", head: true }).eq("rol", "alumno").eq("activo", true),
    supabase.from("cursos").select("*", { count: "exact", head: true }).eq("estado", "publicado"),
    supabase.from("inscripciones").select("*", { count: "exact", head: true }).eq("estado", "activa"),
    supabase.from("certificados").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Alumnos activos", valor: totalAlumnos ?? 0 },
    { label: "Cursos publicados", valor: totalCursos ?? 0 },
    { label: "Inscripciones activas", valor: totalInscripciones ?? 0 },
    { label: "Certificados emitidos", valor: totalCertificados ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl text-crema">Hola, {perfil.nombre ?? "equipo"}</h1>
        <p className="mt-1 text-sm text-crema/50">
          Panel de Essence Academy.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p className="font-display text-3xl text-dorado">{s.valor}</p>
            <p className="mt-1 text-xs text-crema/50">{s.label}</p>
          </Card>
        ))}
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
              <h2 className="text-base text-crema">Códigos de acceso</h2>
              <p className="mt-1 text-sm text-crema/50">
                Creá y administrá códigos de invitación.
              </p>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
