// Guards de autorización del lado servidor (defensa en profundidad junto a RLS).
import { redirect } from "next/navigation";
import { createClienteServidor } from "@/lib/supabase/server";

export type Rol = "admin" | "educador" | "alumno";

export type Perfil = {
  id: string;
  nombre: string | null;
  email: string | null;
  rol: Rol;
  avatar_url: string | null;
  activo: boolean;
};

// Perfil del usuario autenticado, o null si no hay sesión.
export async function obtenerPerfil(): Promise<Perfil | null> {
  const supabase = createClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol, avatar_url, activo")
    .eq("id", user.id)
    .single();

  return (data as Perfil) ?? null;
}

// Exige sesión activa; si no, manda al login.
export async function requerirSesion(): Promise<Perfil> {
  const perfil = await obtenerPerfil();
  if (!perfil) redirect("/login");
  return perfil;
}

// Exige rol admin o educador.
export async function requerirStaff(): Promise<Perfil> {
  const perfil = await requerirSesion();
  if (perfil.rol !== "admin" && perfil.rol !== "educador") redirect("/inicio");
  return perfil;
}

// Exige rol admin.
export async function requerirAdmin(): Promise<Perfil> {
  const perfil = await requerirSesion();
  if (perfil.rol !== "admin") redirect("/inicio");
  return perfil;
}

export function esStaff(rol: Rol): boolean {
  return rol === "admin" || rol === "educador";
}
