import { requerirSesion } from "@/lib/auth/guards";
import { BarraSuperior } from "@/components/layout/BarraSuperior";

// Cara del alumno (también accesible al staff para ver la experiencia).
export default async function AcademiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await requerirSesion();
  return (
    <div className="min-h-screen bg-marino">
      <BarraSuperior perfil={perfil} />
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
