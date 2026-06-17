import { requerirStaff } from "@/lib/auth/guards";
import { BarraPanel } from "@/components/layout/BarraPanel";
import { NavPanel } from "@/components/layout/NavPanel";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await requerirStaff();
  return (
    <div className="min-h-screen bg-marino">
      <BarraPanel perfil={perfil} />
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
        <aside className="hidden w-52 shrink-0 md:block">
          <NavPanel perfil={perfil} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
