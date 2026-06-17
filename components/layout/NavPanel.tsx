"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Perfil } from "@/lib/auth/guards";

type NavLink = { href: string; label: string; exacto?: boolean };

const LINKS_STAFF: NavLink[] = [
  { href: "/panel", label: "Inicio", exacto: true },
  { href: "/panel/cursos", label: "Cursos" },
  { href: "/panel/alumnos", label: "Alumnos" },
  { href: "/panel/progreso", label: "Progreso" },
];

const LINKS_ADMIN: NavLink[] = [
  { href: "/panel/codigos", label: "Códigos de acceso" },
];

export function NavPanel({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname();
  const esAdmin = perfil.rol === "admin";
  const links = esAdmin ? [...LINKS_STAFF, ...LINKS_ADMIN] : LINKS_STAFF;

  function activo(href: string, exacto?: boolean) {
    if (exacto) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            activo(l.href, l.exacto)
              ? "rounded-lg bg-white/5 px-3 py-2 text-sm text-crema"
              : "rounded-lg px-3 py-2 text-sm text-crema/60 transition-colors hover:bg-white/5 hover:text-crema"
          }
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
