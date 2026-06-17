import Link from "next/link";
import type { Perfil } from "@/lib/auth/guards";

const LINKS_STAFF = [
  { href: "/panel", label: "Inicio", exacto: true },
  { href: "/panel/cursos", label: "Cursos" },
  { href: "/panel/alumnos", label: "Alumnos" },
  { href: "/panel/progreso", label: "Progreso" },
];

const LINKS_ADMIN = [
  { href: "/panel/codigos", label: "Códigos de acceso" },
];

export function NavPanel({ perfil }: { perfil: Perfil }) {
  const esAdmin = perfil.rol === "admin";
  const links = esAdmin ? [...LINKS_STAFF, ...LINKS_ADMIN] : LINKS_STAFF;

  return (
    <nav className="flex flex-col gap-0.5">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-lg px-3 py-2 text-sm text-crema/60 transition-colors hover:bg-white/5 hover:text-crema"
        >
          {l.label}
        </Link>
      ))}
      <div className="my-2 border-t border-white/10" />
      <Link
        href="/inicio"
        className="rounded-lg px-3 py-2 text-sm text-crema/40 transition-colors hover:bg-white/5 hover:text-crema/70"
      >
        Ver academia
      </Link>
    </nav>
  );
}
