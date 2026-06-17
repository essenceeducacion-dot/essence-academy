import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { flags } from "@/lib/env";
import type { Perfil } from "@/lib/auth/guards";

const etiquetaRol: Record<Perfil["rol"], string> = {
  admin: "Administración",
  educador: "Educador",
  alumno: "Alumno",
};

export function BarraSuperior({ perfil }: { perfil: Perfil }) {
  return (
    <header className="border-b border-white/10 bg-marino-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/inicio" className="text-crema/70 hover:text-crema">
              Mis cursos
            </Link>
            {flags.comunidad && (
              <Link href="/comunidad" className="text-crema/70 hover:text-crema">
                Comunidad
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-crema">{perfil.nombre ?? perfil.email}</p>
            <p className="text-xs text-dorado/80">{etiquetaRol[perfil.rol]}</p>
          </div>
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
