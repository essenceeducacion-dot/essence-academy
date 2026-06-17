import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { cerrarSesion } from "@/app/(auth)/acciones";
import type { Perfil } from "@/lib/auth/guards";

const etiquetaRol: Record<Perfil["rol"], string> = {
  admin: "Administración",
  educador: "Educador",
  alumno: "Alumno",
};

export function BarraPanel({ perfil }: { perfil: Perfil }) {
  return (
    <header className="border-b border-white/10 bg-marino-900/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3.5">
        <Link href="/panel">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/perfil" className="text-right transition-opacity hover:opacity-80">
            <p className="text-sm text-crema">{perfil.nombre ?? perfil.email}</p>
            <p className="text-xs text-dorado/80">{etiquetaRol[perfil.rol]}</p>
          </Link>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm text-crema/70 transition-colors hover:bg-white/5 hover:text-crema"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
