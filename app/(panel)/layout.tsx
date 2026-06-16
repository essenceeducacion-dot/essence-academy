import { requerirStaff } from "@/lib/auth/guards";
import { BarraSuperior } from "@/components/layout/BarraSuperior";

// Backoffice: solo admin y educadores.
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await requerirStaff();
  return (
    <div className="min-h-screen bg-marino">
      <BarraSuperior perfil={perfil} />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
