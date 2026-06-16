import { redirect } from "next/navigation";
import { obtenerPerfil, esStaff } from "@/lib/auth/guards";

// Punto de entrada: deriva al usuario según su sesión y rol.
export default async function Home() {
  const perfil = await obtenerPerfil();
  if (!perfil) redirect("/login");
  redirect(esStaff(perfil.rol) ? "/panel" : "/inicio");
}
